import type { TSESTree } from "@typescript-eslint/utils";
import { isObservableExpression } from "../utils/ast-helpers";
import { createRule } from "../utils/create-rule";

type MessageIds = "observableInJsx";

/**
 * Renders a human-readable name for an observable node.
 * e.g. `count$` → `'count$'`, `user$.name` → `'user$.name'`
 */
function getObservableName(node: TSESTree.Node): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const obj = getObservableName(node.object);
    if (node.computed) return `${obj}[...]`;
    if (node.property.type === "Identifier") return `${obj}.${node.property.name}`;
    return obj;
  }
  return "(observable)";
}

export const noObservableInJsx = createRule<[], MessageIds>({
  name: "no-observable-in-jsx",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow rendering observables as JSX text nodes. Call '.get()' or wrap with a reactive component.",
    },
    messages: {
      observableInJsx:
        "Observable '{{name}}' is rendered as a text node. Call '.get()' to read its value, e.g., '{{name}}.get()'.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXExpressionContainer(node: TSESTree.JSXExpressionContainer) {
        const { expression } = node;

        if (expression.type === "JSXEmptyExpression") return;
        if (!isObservableExpression(expression)) return;

        const parent = node.parent;
        if (!parent) return;
        if (parent.type !== "JSXElement" && parent.type !== "JSXFragment") return;

        context.report({
          node,
          messageId: "observableInJsx",
          data: { name: getObservableName(expression) },
        });
      },
    };
  },
});
