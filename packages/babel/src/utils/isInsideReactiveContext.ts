import type { NodePath } from '@babel/core';

/**
 * Returns true if the path has a parent JSXElement whose tag name is in reactiveComponents.
 * Used to skip wrapping inside Auto, For, Show, Memo, Computed, Switch, etc.
 *
 * Uses direct node.type comparison instead of t.isJSXIdentifier() to avoid
 * needing to pass `t` as a parameter.
 */
export function isInsideReactiveContext(
  path: NodePath,
  reactiveComponents: Set<string>,
): boolean {
  return (
    path.findParent((p) => {
      if (!p.isJSXElement()) return false;
      const name = p.node.openingElement.name;
      return (
        name.type === 'JSXIdentifier' && reactiveComponents.has(name.name)
      );
    }) !== null
  );
}
