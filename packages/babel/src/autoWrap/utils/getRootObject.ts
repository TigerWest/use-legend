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
    return getRootObject((node as Node & { object: Node }).object);
  }
  return null;
}

/**
 * Checks if any Identifier segment along a MemberExpression / OptionalMemberExpression
 * chain has a name ending with `$`. This is the relaxed, "some-segment" form used by
 * autoWrap so that `drag.x$.get()` or `items[0].item$.get()` still counts as an
 * observable read, even though the leftmost root (`drag`, `items`) does not end in `$`.
 *
 * Rules:
 * - Leftmost root Identifier → checked.
 * - Non-computed MemberExpression property (`.x$`) → checked.
 * - Computed property (`[key]`, `[0]`) → skipped (the bracket expression is not part
 *   of the chain's identifier path; it could be any expression).
 * - Other node types (CallExpression, etc.) in the object position → stop, return false.
 *
 * Examples:
 *   drag.x$.get()             → true  (property `x$`)
 *   drag.nested.x$.get()      → true  (property `x$`)
 *   drag.x$?.get()            → true  (property `x$` in OptionalMemberExpression object)
 *   items[0].x$.get()         → true  (property `x$`, computed segment skipped)
 *   obs$.nested.get()         → true  (root `obs$`)
 *   plain.value.get()         → false (no `$` anywhere)
 */
export function hasDollarSegmentInChain(node: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (current.type === "Identifier") {
      return (current as Identifier).name.endsWith("$");
    }
    if (current.type === "MemberExpression" || current.type === "OptionalMemberExpression") {
      const member = current as Node & {
        object: Node;
        property: Node;
        computed: boolean;
      };
      if (!member.computed && member.property.type === "Identifier") {
        if ((member.property as Identifier).name.endsWith("$")) {
          return true;
        }
      }
      current = member.object;
      continue;
    }
    return false;
  }
  return false;
}
