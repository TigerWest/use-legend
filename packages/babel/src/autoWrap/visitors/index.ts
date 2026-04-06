export { createProgramVisitor } from "./program";
export { createJSXElementVisitor } from "./jsxElement";
export { createJSXExpressionContainerVisitor } from "./jsxExpressionContainer";

import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Program } from "@babel/types";
import type { PluginOptions, PluginState } from "../types";
import { createProgramVisitor } from "./program";
import { createJSXElementVisitor } from "./jsxElement";
import { createJSXExpressionContainerVisitor } from "./jsxExpressionContainer";

export function createAutoWrapVisitor(t: typeof BabelTypes) {
  const programVisitor = createProgramVisitor(t);
  const JSXElement = createJSXElementVisitor(t);
  const JSXExpressionContainer = createJSXExpressionContainerVisitor(t);

  const program = {
    enter(path: NodePath<Program>, state: PluginState, opts: PluginOptions = {}) {
      state.opts = opts;
      programVisitor.enter(path, state);
    },
    exit(path: NodePath<Program>, state: PluginState) {
      programVisitor.exit(path, state);
    },
  };

  return { program, JSXElement, JSXExpressionContainer };
}
