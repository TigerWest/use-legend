import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Program } from "@babel/types";
import type { PluginState } from "../types";
import { addAutoImport } from "../utils/addAutoImport";

export function createProgramVisitor(t: typeof BabelTypes) {
  return {
    enter(path: NodePath<Program>, state: PluginState) {
      const opts = state.opts ?? {};
      state.autoImportNeeded = false;
      state.autoImportSource = opts.importSource ?? "@legendapp/state/react";
      state.autoComponentName = opts.componentName ?? "Memo";
      state.reactiveComponents = new Set([
        state.autoComponentName,
        "For",
        "Show",
        "Memo",
        "Computed",
        "Switch",
        ...(opts.reactiveComponents ?? []),
      ]);
      state.observerNames = new Set(["observer", ...(opts.observerNames ?? [])]);
      state.autoWrapChildrenComponents =
        opts.wrapReactiveChildren !== false
          ? new Set(["Memo", "Show", "Computed", ...(opts.wrapReactiveChildrenComponents ?? [])])
          : new Set(opts.wrapReactiveChildrenComponents ?? []);
    },

    exit(path: NodePath<Program>, state: PluginState) {
      if (state.autoImportNeeded) {
        addAutoImport(path, t, state);
      }
    },
  };
}
