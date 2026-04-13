import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";
import { ImportTracker } from "../utils/import-tracker";

type MessageIds = "hookInUseScope" | "hookInScopeDirective";

interface Options {
  useScopeSources: string[];
}

const DEFAULT_USE_SCOPE_SOURCES = ["@usels/core", "@primitives/useScope"];
const HOOK_NAME_RE = /^use(?:[A-Z0-9]|$)/;

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression"
  );
}

function isHookName(name: string): boolean {
  return HOOK_NAME_RE.test(name);
}

function getHookName(callee: TSESTree.CallExpression["callee"]): string | null {
  if (callee.type === "Identifier") {
    return isHookName(callee.name) ? callee.name : null;
  }

  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return isHookName(callee.property.name) ? callee.property.name : null;
  }

  return null;
}

function isUseScopeCall(node: TSESTree.CallExpression, tracker: ImportTracker): boolean {
  const { callee } = node;
  if (callee.type === "Identifier") {
    return callee.name === "useScope" || tracker.isTracked(callee.name);
  }

  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "useScope"
  );
}

function hasScopeDirective(block: TSESTree.BlockStatement): boolean {
  for (const statement of block.body) {
    if (statement.type !== "ExpressionStatement") return false;

    if (statement.directive === "use scope") return true;

    const { expression } = statement;
    if (expression.type !== "Literal" || typeof expression.value !== "string") {
      return false;
    }
    if (expression.value === "use scope") return true;
  }

  return false;
}

function isInsideScopeDirective(ancestors: TSESTree.Node[]): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (!isFunctionNode(ancestor)) continue;
    if (ancestor.body.type === "BlockStatement" && hasScopeDirective(ancestor.body)) {
      return true;
    }
  }

  return false;
}

function isInsideUseScopeFactory(ancestors: TSESTree.Node[], tracker: ImportTracker): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (!isFunctionNode(ancestor)) continue;

    const parent = i > 0 ? ancestors[i - 1] : undefined;
    if (parent?.type !== "CallExpression") continue;
    if (parent.arguments[0] !== ancestor) continue;
    if (isUseScopeCall(parent, tracker)) return true;
  }

  return false;
}

export const noHooksInScope = createRule<[Partial<Options>], MessageIds>({
  name: "no-hooks-in-scope",
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow React hook calls inside `useScope` factories and functions marked with the `"use scope"` directive.',
    },
    messages: {
      hookInUseScope:
        "`{{ name }}` is a hook and cannot be called inside a `useScope` factory. Call hooks before `useScope`, then pass values into the scope as props.",
      hookInScopeDirective:
        '`{{ name }}` is a hook and cannot be used in a function marked with `"use scope"`, because the scoped body is transformed into a `useScope` factory.',
    },
    schema: [
      {
        type: "object",
        properties: {
          useScopeSources: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [userOptions]) {
    const useScopeSources = userOptions.useScopeSources ?? DEFAULT_USE_SCOPE_SOURCES;
    const trackFunctions: Record<string, string[]> = {};
    for (const source of useScopeSources) {
      trackFunctions[source] = ["useScope"];
    }

    const tracker = new ImportTracker(trackFunctions);

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        tracker.processImport(node);
      },

      CallExpression(node: TSESTree.CallExpression) {
        const hookName = getHookName(node.callee);
        if (!hookName) return;

        const ancestors = context.sourceCode.getAncestors(node);

        if (isInsideUseScopeFactory(ancestors, tracker)) {
          context.report({
            node,
            messageId: "hookInUseScope",
            data: { name: hookName },
          });
          return;
        }

        if (isInsideScopeDirective(ancestors)) {
          context.report({
            node,
            messageId: "hookInScopeDirective",
            data: { name: hookName },
          });
        }
      },
    };
  },
});
