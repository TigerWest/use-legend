import type { NodePath } from "@babel/core";
import type { PluginOptions } from "../types";
import { getCallSourceKey } from "./getCallSources";

/**
 * Checks if a NodePath contains a zero-argument .get() call on a $-suffixed observable.
 *
 * IMPORTANT: path.traverse() visits CHILDREN, not the root node itself.
 * We must check the root node separately.
 *
 * - Stops traversal at function boundaries (ArrowFunctionExpression, FunctionExpression, FunctionDeclaration)
 * - Supports OptionalCallExpression: obs$?.get()
 * - Ignores .get(key) calls with arguments (Map.get(key))
 * - When opts.allGet is false (default), root object must end with '$'
 */
const TRAVERSAL_BOUNDARY_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "JSXElement",
  "JSXFragment",
]);

export function hasGetCall(exprPath: NodePath, opts: PluginOptions): boolean {
  // If the root node itself is a function boundary, do not descend into it.
  // path.traverse() visits CHILDREN only, so the ArrowFunctionExpression visitor
  // inside traverse() would NOT fire for the root — leading to false positives.
  if (TRAVERSAL_BOUNDARY_TYPES.has(exprPath.node.type)) {
    return false;
  }

  // Check the root node itself first (traverse does NOT visit it)
  if (getCallSourceKey(exprPath.node, opts) !== null) {
    return true;
  }

  let found = false;

  exprPath.traverse({
    // Stop at function boundaries — don't wrap event handlers or hook callbacks
    ArrowFunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionDeclaration(innerPath) {
      innerPath.skip();
    },
    JSXElement(innerPath) {
      innerPath.skip();
    },
    JSXFragment(innerPath) {
      innerPath.skip();
    },

    OptionalCallExpression(innerPath) {
      if (getCallSourceKey(innerPath.node, opts) !== null) {
        found = true;
        innerPath.stop();
      }
    },

    CallExpression(innerPath) {
      if (getCallSourceKey(innerPath.node, opts) !== null) {
        found = true;
        innerPath.stop();
      }
    },
  });

  return found;
}
