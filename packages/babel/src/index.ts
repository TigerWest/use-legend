import type { PluginObj, types as BabelTypes } from '@babel/core';
import type { PluginState } from './types';
import { createProgramVisitor } from './visitors/program';
import { createJSXElementVisitor } from './visitors/jsxElement';
import { createJSXExpressionContainerVisitor } from './visitors/jsxExpressionContainer';

export type { PluginOptions } from './types';

/**
 * @usels/babel-plugin-legend-memo
 *
 * Automatically wraps Legend-State observable .get() calls in JSX with <Auto> component
 * for fine-grained reactive rendering without wrapping entire components.
 *
 * Detection rules:
 * - Zero-argument .get() on $-suffixed variables (e.g., count$.get(), user$.name.get())
 * - Also supports optional chaining: obs$?.get()
 * - Skips: .get(key) with args, non-$ vars (unless allGet:true), inside reactive contexts
 *
 * @example
 * Input:  <div>{count$.get()}</div>
 * Output: import { Auto } from "@usels/core";
 *         <div><Auto>{() => count$.get()}</Auto></div>
 */
export default function autoWrapPlugin({
  types: t,
}: {
  types: typeof BabelTypes;
}): PluginObj<PluginState> {
  const programVisitor = createProgramVisitor(t);
  const jsxElementVisitor = createJSXElementVisitor(t);
  const jsxExpressionContainerVisitor =
    createJSXExpressionContainerVisitor(t);

  return {
    name: '@usels/babel-plugin-legend-memo',
    visitor: {
      Program: {
        enter: programVisitor.enter,
        exit: programVisitor.exit,
      },
      // JSXElement visitor runs FIRST on each element:
      // If attributes contain .get(), wrap the whole element and skip() children.
      // This prevents double-wrapping when both attrs and children have .get().
      JSXElement: jsxElementVisitor,
      // JSXExpressionContainer visitor handles children .get() cases.
      // It skips expressions inside JSXAttributes (handled by JSXElement visitor).
      JSXExpressionContainer: jsxExpressionContainerVisitor,
    },
  };
}
