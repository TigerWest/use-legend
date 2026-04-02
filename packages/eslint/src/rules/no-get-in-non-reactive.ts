import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";
import { isObservableExpression } from "../utils/ast-helpers";

type MessageIds = "noGetInNonReactive";

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
]);

function isComponentOrHook(name: string): boolean {
  return /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
}

function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  parent: TSESTree.Node | undefined
): string | null {
  if (node.type === "FunctionDeclaration") {
    return node.id?.name ?? null;
  }
  // Arrow / FunctionExpression: `const Name = () => {}`
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name;
  }
  return null;
}

function isModuleLevel(ancestors: TSESTree.Node[], fnIdx: number): boolean {
  const fnNode = ancestors[fnIdx];
  const parent = fnIdx > 0 ? ancestors[fnIdx - 1] : undefined;

  if (fnNode.type === "FunctionDeclaration") {
    return (
      parent?.type === "Program" ||
      parent?.type === "ExportNamedDeclaration" ||
      parent?.type === "ExportDefaultDeclaration"
    );
  }

  // Arrow / FunctionExpression: VariableDeclarator → VariableDeclaration → Program/Export*
  if (parent?.type === "VariableDeclarator") {
    const grandParent = fnIdx > 1 ? ancestors[fnIdx - 2] : undefined;
    const greatGrandParent = fnIdx > 2 ? ancestors[fnIdx - 3] : undefined;
    return (
      grandParent?.type === "VariableDeclaration" &&
      (greatGrandParent?.type === "Program" ||
        greatGrandParent?.type === "ExportNamedDeclaration" ||
        greatGrandParent?.type === "ExportDefaultDeclaration")
    );
  }

  return false;
}

function getObservableName(node: TSESTree.Node): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const obj = getObservableName(node.object);
    const prop = node.property.type === "Identifier" ? node.property.name : "...";
    return `${obj}.${prop}`;
  }
  return "obs$";
}

export const noGetInNonReactive = createRule<[], MessageIds>({
  name: "no-get-in-non-reactive",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `.get()` on observables directly in a React component or hook body. Wrap in `useObservable`, `useObserve`, or render inside `<Memo>`.",
    },
    messages: {
      noGetInNonReactive:
        "`{{ name }}.get()` is a one-time snapshot — changes after mount are ignored. " +
        "Use `useObservable(() => {{ name }}.get())`, `useObserve`, or `<Memo>{() => ...}</Memo>`.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Must be expr.get() with no arguments
        if (node.callee.type !== "MemberExpression") return;
        if (node.arguments.length !== 0) return;
        const { property, object } = node.callee;
        if (property.type !== "Identifier" || property.name !== "get") return;
        if (!isObservableExpression(object)) return;

        const ancestors = context.sourceCode.getAncestors(node);

        // Find the outermost module-level component/hook in the ancestor chain
        let targetFnIdx = -1;
        for (let i = 0; i < ancestors.length; i++) {
          const a = ancestors[i];
          if (!FUNCTION_TYPES.has(a.type)) continue;

          const parent = i > 0 ? ancestors[i - 1] : undefined;
          const fn = a as
            | TSESTree.FunctionDeclaration
            | TSESTree.ArrowFunctionExpression
            | TSESTree.FunctionExpression;
          const name = getFunctionName(fn, parent);

          if (!name || !isComponentOrHook(name)) continue;
          if (!isModuleLevel(ancestors, i)) continue;

          targetFnIdx = i;
          break;
        }

        if (targetFnIdx === -1) return; // not inside a component or hook

        // If any nested function exists between targetFn and this .get() call, skip
        for (let i = targetFnIdx + 1; i < ancestors.length; i++) {
          if (FUNCTION_TYPES.has(ancestors[i].type)) return;
        }

        context.report({
          node,
          messageId: "noGetInNonReactive",
          data: { name: getObservableName(object) },
        });
      },
    };
  },
});
