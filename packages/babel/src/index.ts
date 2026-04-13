import type { PluginObj, types as BabelTypes } from "@babel/core";
import type { PluginState } from "./autoWrap/types";
import type { AutoScopeOptions, AutoScopeState } from "./autoScope/types";
import { createAutoWrapVisitor } from "./autoWrap/visitors/index";
import { createAutoScopeVisitor } from "./autoScope/visitors/index";

export type { PluginOptions } from "./autoWrap/types";
export type { AutoScopeOptions } from "./autoScope/types";
export { autoScopePlugin } from "./autoScope/index";

export interface CombinedOptions {
  autoWrap?: import("./autoWrap/types").PluginOptions;
  autoScope?: AutoScopeOptions;
}

type CombinedState = Omit<PluginState, "opts"> &
  Omit<AutoScopeState, "opts"> & { opts: CombinedOptions };

export default function useLsPlugin({
  types: t,
}: {
  types: typeof BabelTypes;
}): PluginObj<CombinedState> {
  const autoWrap = createAutoWrapVisitor(t);
  const autoScope = createAutoScopeVisitor(t);

  return {
    name: "@usels/babel-plugin",
    visitor: {
      Program: {
        enter(path, state) {
          autoWrap.program.enter(path, state as unknown as PluginState, state.opts.autoWrap);
          autoScope.program.enter(state as unknown as AutoScopeState, state.opts.autoScope);
        },
        exit(path, state) {
          autoWrap.program.exit(path, state as unknown as PluginState);
          autoScope.program.exit(path, state as unknown as AutoScopeState);
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      JSXElement: autoWrap.JSXElement as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      JSXFragment: autoWrap.JSXFragment as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      JSXExpressionContainer: autoWrap.JSXExpressionContainer as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      FunctionDeclaration: autoScope.FunctionDeclaration as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      FunctionExpression: autoScope.FunctionExpression as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ArrowFunctionExpression: autoScope.ArrowFunctionExpression as any,
    },
  };
}
