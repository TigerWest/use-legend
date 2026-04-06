import type { NodePath } from "@babel/core";

/**
 * Returns true if the path is directly inside a JSXAttribute,
 * WITHOUT crossing a JSXElement or JSXFragment boundary.
 *
 * This ensures that children of a JSXElement nested inside an attribute
 * (e.g., aside={<Wrapper>{obs$.get()}</Wrapper>}) are NOT considered
 * "inside an attribute" — they are children and should be handled by
 * the JSXExpressionContainer visitor.
 */
export function isInsideAttribute(path: NodePath): boolean {
  const found = path.findParent((p) => p.isJSXAttribute() || p.isJSXElement() || p.isJSXFragment());
  return found !== null && found.isJSXAttribute();
}
