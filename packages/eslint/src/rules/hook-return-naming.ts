import type { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/create-rule";

type MessageIds = "dollarSuffixRemoved";

interface Options {
  enforceOnAllDestructuring: boolean;
}

export const hookReturnNaming = createRule<[Options], MessageIds>({
  name: "hook-return-naming",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require $ suffix to be preserved when renaming destructured $ fields.",
    },
    messages: {
      dollarSuffixRemoved:
        "Renaming '{{key}}' to '{{local}}' removes the '$' suffix. Use '{{key}}: {{local}}$' or keep '{{key}}' as-is.",
    },
    schema: [
      {
        type: "object",
        properties: {
          enforceOnAllDestructuring: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ enforceOnAllDestructuring: true }],
  create(context, [options]) {
    return {
      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        // Must be object destructuring pattern
        if (node.id.type !== "ObjectPattern") return;

        // Optionally restrict to function call initializers
        if (!options.enforceOnAllDestructuring) {
          if (!node.init || node.init.type !== "CallExpression") return;
        }

        const pattern = node.id;

        for (const prop of pattern.properties) {
          // Skip rest elements (...rest)
          if (prop.type !== "Property") continue;

          // Get the key name
          const key = prop.key;
          if (key.type !== "Identifier") continue;
          const keyName = key.name;

          // Only check keys ending with $
          if (!keyName.endsWith("$")) continue;

          // Shorthand: `{ x$ }` - key and value are the same, always valid
          if (prop.shorthand) continue;

          // Non-shorthand: `{ x$: localName }` - check local binding
          const value = prop.value;
          if (value.type !== "Identifier") continue; // skip patterns like { x$: { a } }

          const localName = value.name;

          // If local name doesn't end with $, report
          if (!localName.endsWith("$")) {
            context.report({
              node: prop,
              messageId: "dollarSuffixRemoved",
              data: { key: keyName, local: localName },
            });
          }
        }
      },
    };
  },
});
