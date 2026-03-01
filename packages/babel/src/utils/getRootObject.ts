import type { Node, MemberExpression, Identifier } from "@babel/types";

/**
 * Extracts the root Identifier from a MemberExpression / OptionalMemberExpression chain.
 * Examples:
 *   user$.profile.name     → Identifier(user$)
 *   obs$.items[0].name     → Identifier(obs$)   (computed traversed)
 *   obs$?.nested.name      → Identifier(obs$)   (optional chaining traversed)
 *   count$                 → Identifier(count$)
 *   Returns null for CallExpression etc.
 */
export function getRootObject(node: Node): Identifier | null {
  if (node.type === "Identifier") {
    return node as Identifier;
  }
  // Traverse through MemberExpression (computed or not)
  if (node.type === "MemberExpression") {
    return getRootObject((node as MemberExpression).object);
  }
  // Traverse through OptionalMemberExpression (obs$?.nested.get())
  if (node.type === "OptionalMemberExpression") {
    return getRootObject((node as any).object);
  }
  return null;
}
