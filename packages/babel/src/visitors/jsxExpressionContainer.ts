import type { NodePath, types as BabelTypes } from "@babel/core";
import type { JSXExpressionContainer } from "@babel/types";
import type { PluginState } from "../types";
import { hasGetCall } from "../utils/hasGetCall";
import { isInsideReactiveContext } from "../utils/isInsideReactiveContext";
import { isInsideObserverHOC } from "../utils/isInsideObserverHOC";
import { isInsideAttribute } from "../utils/isInsideAttribute";
import { createAutoElement } from "../utils/createAutoElement";

export function createJSXExpressionContainerVisitor(t: typeof BabelTypes) {
  return function JSXExpressionContainer(
    path: NodePath<JSXExpressionContainer>,
    state: PluginState
  ): void {
    // 1. Skip if inside a JSXAttribute — JSXElement visitor handles those
    if (isInsideAttribute(path)) return;

    // 2. Skip if already inside a reactive context (Auto, For, Show, Memo, etc.)
    if (isInsideReactiveContext(path, state.reactiveComponents)) return;

    // 3. Skip if inside an observer() HOC
    if (isInsideObserverHOC(path, state.observerNames)) return;

    // 4. Skip JSXEmptyExpression {}
    const expression = path.node.expression;
    if (expression.type === "JSXEmptyExpression") return;

    // 5. Check if the expression contains a .get() call
    const exprPath = path.get("expression") as NodePath;
    if (!hasGetCall(exprPath, state.opts)) return;

    // 6. Wrap the expression in <Auto>{() => expression}</Auto>
    const autoElement = createAutoElement(t, expression, state.autoComponentName);
    path.replaceWith(autoElement);

    state.autoImportNeeded = true;
  };
}
