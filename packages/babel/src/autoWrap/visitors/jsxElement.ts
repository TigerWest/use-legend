import type { NodePath, types as BabelTypes } from "@babel/core";
import type { JSXElement } from "@babel/types";
import type { PluginState } from "../types";
import { hasAttributeGetCall } from "../utils/hasAttributeGetCall";
import { isInsideReactiveContext } from "../utils/isInsideReactiveContext";
import { isInsideObserverHOC } from "../utils/isInsideObserverHOC";
import { createAutoElement } from "../utils/createAutoElement";
import { wrapChildrenAsFunction } from "../utils/wrapChildrenAsFunction";

/**
 * Pre-wraps nested JSXElement values in attributes with <Memo> before the parent is wrapped.
 * This ensures fine-grained reactive boundaries when both parent and nested elements have .get().
 *
 * Without this, path.skip() after wrapping the parent would prevent inner JSXElements
 * from being visited by the normal JSXElement visitor pass.
 */
function preWrapAttributeJSXElements(
  t: typeof BabelTypes,
  jsxElementPath: NodePath<JSXElement>,
  state: PluginState
): void {
  const openingEl = jsxElementPath.get("openingElement");
  const attributes = openingEl.get("attributes") as NodePath[];

  for (const attrPath of attributes) {
    if (!attrPath.isJSXAttribute()) continue;

    const valuePath = attrPath.get("value") as NodePath;
    if (!valuePath.isJSXExpressionContainer()) continue;

    const exprPath = valuePath.get("expression") as NodePath;
    if (!exprPath.isJSXElement()) continue;

    const innerJsxPath = exprPath as NodePath<JSXElement>;
    if (!hasAttributeGetCall(innerJsxPath, state.opts)) continue;

    // Recursively pre-wrap deeper nested JSXElements first
    preWrapAttributeJSXElements(t, innerJsxPath, state);

    const autoElement = createAutoElement(t, innerJsxPath.node, state.autoComponentName);
    exprPath.replaceWith(autoElement);
    state.autoImportNeeded = true;
  }
}

export function createJSXElementVisitor(t: typeof BabelTypes) {
  return function JSXElement(path: NodePath<JSXElement>, state: PluginState): void {
    // STEP 1 (NEW): If this element is Memo/Show/Computed (or configured),
    // auto-wrap non-function children in () => — equivalent to @legendapp/state/babel
    const elementName =
      path.node.openingElement.name.type === "JSXIdentifier"
        ? path.node.openingElement.name.name
        : null;

    if (elementName && state.autoWrapChildrenComponents.has(elementName)) {
      const wrapped = wrapChildrenAsFunction(t, path.node);
      if (wrapped !== null) {
        path.replaceWith(wrapped);
        // path.node now points to the new element — continue to check attributes
      }
    }

    // 1. Skip if already inside a reactive context (Auto, For, Show, Memo, etc.)
    if (isInsideReactiveContext(path, state.reactiveComponents)) return;

    // 2. Skip if inside an observer() HOC
    if (isInsideObserverHOC(path, state.observerNames)) return;

    // 3. Check if any non-special attributes contain .get() calls
    if (!hasAttributeGetCall(path, state.opts)) return;

    // 4. Pre-wrap nested JSXElements in attributes that have their own .get() calls
    //    (path.skip() below would prevent them from being visited normally)
    preWrapAttributeJSXElements(t, path, state);

    // 5. Wrap the entire JSXElement in <Auto>{() => element}</Auto>
    const autoElement = createAutoElement(t, path.node, state.autoComponentName);
    path.replaceWith(autoElement);

    state.autoImportNeeded = true;

    // 6. Skip traversal of the new node to prevent double-wrapping
    path.skip();
  };
}
