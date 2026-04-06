import type { PluginObj, types as BabelTypes } from "@babel/core";
import type { AutoScopeState } from "./types";
import { createAutoScopeVisitor } from "./visitors/index";

export type { AutoScopeOptions } from "./types";

export function autoScopePlugin({
  types: t,
}: {
  types: typeof BabelTypes;
}): PluginObj<AutoScopeState> {
  const autoScope = createAutoScopeVisitor(t);

  return {
    name: "@usels/babel-plugin-use-scope",
    visitor: {
      Program: {
        enter(_path, state) {
          autoScope.program.enter(state, state.opts);
        },
        exit(path, state) {
          autoScope.program.exit(path, state);
        },
      },
      FunctionDeclaration: autoScope.FunctionDeclaration,
      FunctionExpression: autoScope.FunctionExpression,
      ArrowFunctionExpression: autoScope.ArrowFunctionExpression,
    },
  };
}
