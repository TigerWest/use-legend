import type { NodePath, types as BabelTypes } from "@babel/core";
import type { AutoScopeOptions, AutoScopeState } from "../types";
import { createFunctionVisitor } from "./function";
import { addUseScopeImport } from "../utils/addUseScopeImport";

export function createAutoScopeVisitor(t: typeof BabelTypes) {
  const { FunctionDeclaration, FunctionExpression, ArrowFunctionExpression } =
    createFunctionVisitor(t);

  const program = {
    enter(state: AutoScopeState, opts: AutoScopeOptions = {}) {
      state.useScopeImportNeeded = false;
      state.useScopeImportSource = opts.importSource ?? "@usels/core";
    },
    exit(path: NodePath<BabelTypes.Program>, state: AutoScopeState) {
      if (state.useScopeImportNeeded) {
        addUseScopeImport(path, t, state.useScopeImportSource);
      }
    },
  };

  return { program, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression };
}
