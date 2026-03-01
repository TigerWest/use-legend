import type { TSESTree } from "@typescript-eslint/utils";
import { ImportTracker } from "../utils/import-tracker";
import { createRule } from "../utils/create-rule";

type MessageIds = "noReactiveHoc";

interface Options {
  forbidHOCs: string[];
  importSources: string[];
  allowList: string[];
  message?: string;
}

export const noReactiveHoc = createRule<[Partial<Options>], MessageIds>({
  name: "no-reactive-hoc",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn against using reactive HOCs (observer, reactive, reactiveObserver). Use Show/For/Memo for fine-grained reactivity instead.",
    },
    messages: {
      noReactiveHoc:
        "'{{name}}' wraps the entire component in a reactive observer, causing whole-component re-renders. Use <Show>, <For>, or <Memo> for fine-grained reactivity instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          forbidHOCs: { type: "array", items: { type: "string" } },
          importSources: { type: "array", items: { type: "string" } },
          allowList: { type: "array", items: { type: "string" } },
          message: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [userOptions]) {
    const forbidHOCs = userOptions.forbidHOCs ?? ["reactive", "reactiveObserver", "observer"];
    const importSources = userOptions.importSources ?? ["@legendapp/state/react"];
    const allowList = userOptions.allowList ?? [];

    const effectiveForbid = forbidHOCs.filter((hoc) => !allowList.includes(hoc));

    // Build trackFunctions: each source tracks all effectiveForbid HOCs.
    // Only add source if there's something to track — empty array means "track ALL" in ImportTracker.
    const trackFunctions: Record<string, string[]> = {};
    if (effectiveForbid.length > 0) {
      for (const src of importSources) {
        trackFunctions[src] = effectiveForbid;
      }
    }

    const tracker = new ImportTracker(trackFunctions);

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        tracker.processImport(node);
      },

      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "Identifier") return;
        const calleeName = node.callee.name;
        if (!tracker.isTracked(calleeName)) return;

        context.report({
          node,
          messageId: "noReactiveHoc",
          data: { name: calleeName },
        });
      },
    };
  },
});
