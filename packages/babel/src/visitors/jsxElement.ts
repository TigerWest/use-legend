import type { NodePath, types as BabelTypes } from '@babel/core';
import type { JSXElement } from '@babel/types';
import type { PluginState } from '../types';
import { hasAttributeGetCall } from '../utils/hasAttributeGetCall';
import { isInsideReactiveContext } from '../utils/isInsideReactiveContext';
import { isInsideObserverHOC } from '../utils/isInsideObserverHOC';
import { createAutoElement } from '../utils/createAutoElement';
import { wrapChildrenAsFunction } from '../utils/wrapChildrenAsFunction';

export function createJSXElementVisitor(t: typeof BabelTypes) {
  return function JSXElement(
    path: NodePath<JSXElement>,
    state: PluginState,
  ): void {
    // STEP 1 (NEW): If this element is Memo/Show/Computed (or configured),
    // auto-wrap non-function children in () => — equivalent to @legendapp/state/babel
    const elementName =
      path.node.openingElement.name.type === 'JSXIdentifier'
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

    // 4. Wrap the entire JSXElement in <Auto>{() => element}</Auto>
    const autoElement = createAutoElement(
      t,
      path.node,
      state.autoComponentName,
    );
    path.replaceWith(autoElement);

    state.autoImportNeeded = true;

    // 5. Skip traversal of the new node to prevent double-wrapping
    path.skip();
  };
}
