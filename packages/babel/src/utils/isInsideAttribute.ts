import type { NodePath } from "@babel/core";

/**
 * Returns true if the path is inside a JSXAttribute.
 * Used by JSXExpressionContainer visitor to skip attribute expressions
 * (those are handled by the JSXElement visitor instead).
 */
export function isInsideAttribute(path: NodePath): boolean {
  return path.findParent((p) => p.isJSXAttribute()) !== null;
}
