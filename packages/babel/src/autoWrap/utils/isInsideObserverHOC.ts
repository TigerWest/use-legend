import type { NodePath } from "@babel/core";

/**
 * Returns true if the path is inside an observer() HOC call expression.
 * observer() wraps a function component, making it reactive — no Auto wrapping needed.
 *
 * Unlike reactive JSX components (Memo, Show, etc.), observer() is a CallExpression
 * wrapper rather than a JSXElement boundary.
 *
 * Default observerNames: ["observer"]
 * Configurable via opts.observerNames: ["observer", "reactive", ...]
 */
export function isInsideObserverHOC(path: NodePath, observerNames: Set<string>): boolean {
  return (
    path.findParent((p) => {
      if (!p.isCallExpression()) return false;
      const callee = p.node.callee;
      return callee.type === "Identifier" && observerNames.has(callee.name);
    }) !== null
  );
}
