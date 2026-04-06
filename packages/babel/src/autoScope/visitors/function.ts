import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Function as BabelFunction } from "@babel/types";
import type { AutoScopeState } from "../types";
import { hasScopeDirective } from "../utils/detectDirective";
import { splitBody } from "../utils/splitBody";
import { detectEarlyReturns } from "../utils/detectEarlyReturns";
import { collectPropsInScope } from "../utils/collectPropsInScope";
import { extractBindings, buildUseScopeDeclaration } from "../utils/buildUseScope";

/**
 * WeakSet prevents re-transformation of factory arrows inserted by this transform.
 * Module-scoped — node refs are GC'd when babel is done with them, so watch mode is safe.
 */
const transformed = new WeakSet<import("@babel/types").Node>();

export function createFunctionVisitor(t: typeof BabelTypes) {
  function handleFunction(path: NodePath<BabelFunction>, state: AutoScopeState): void {
    // Skip already-transformed nodes (inserted factory arrows)
    if (transformed.has(path.node)) return;

    const bodyPath = path.get("body");
    if (!bodyPath.isBlockStatement()) return; // concise arrow: () => expr — skip

    const stmts = bodyPath.node.body;

    // 1. Fast exit if no "use scope" directive
    if (!hasScopeDirective(bodyPath.node)) return;

    // Mark immediately to prevent re-entry
    transformed.add(path.node);

    // 2. Remove directive from block so it doesn't appear in output
    bodyPath.node.directives = bodyPath.node.directives.filter(
      (d) => d.value.value !== "use scope"
    );

    // 3. Split body: find final return (directive already removed from directives, not body)
    const { declarations, finalReturn } = splitBody(stmts, t);

    // 3. Detect early returns inside declarations (deep traverse)
    detectEarlyReturns(path, new Set(declarations));

    // 4. Collect props referenced in scope body and rewrite identifiers in-place.
    //    Safe to run after detectEarlyReturns — scope bindings are not mutated by
    //    early-return detection. collectPropsInScope runs before extractBindings
    //    because it mutates identifier nodes inside declarations.
    const propsInfo = collectPropsInScope(path, declarations, t);

    // 5. Extract variable bindings from declarations
    const bindings = extractBindings(declarations, t);

    // 6. If nothing to scope (empty body after directive)
    if (declarations.length === 0) {
      bodyPath.node.body = finalReturn ? [finalReturn] : [];
      return;
    }

    // 7. Build useScope declaration
    const useScopeDecl = buildUseScopeDeclaration(t, declarations, bindings, propsInfo);

    // 8. Mark inserted factory arrows so they're not re-traversed
    markNodes(useScopeDecl, t);

    // 9. Replace body: [useScope decl, return stmt]
    bodyPath.node.body = [useScopeDecl, ...(finalReturn ? [finalReturn] : [])];

    state.useScopeImportNeeded = true;
  }

  return {
    // Depth-first traversal: nested "use scope" components transform first.
    // Each transforms independently — correct by design.
    FunctionDeclaration: handleFunction,
    FunctionExpression: handleFunction,
    ArrowFunctionExpression: handleFunction,
  };
}

function markNodes(node: import("@babel/types").Node, t: typeof BabelTypes): void {
  const stack: import("@babel/types").Node[] = [node];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (t.isArrowFunctionExpression(n) || t.isFunctionExpression(n)) {
      transformed.add(n);
    }
    for (const key of Object.keys(n)) {
      const child = (n as unknown as Record<string, unknown>)[key];
      if (!child || typeof child !== "object") continue;
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && "type" in item)
            stack.push(item as import("@babel/types").Node);
        }
      } else if ("type" in child) {
        stack.push(child as import("@babel/types").Node);
      }
    }
  }
}
