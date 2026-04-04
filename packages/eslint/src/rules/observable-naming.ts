import type { TSESTree } from "@typescript-eslint/utils";
import { ImportTracker } from "../utils/import-tracker";
import type { TrackFunctionsConfig } from "../utils/import-tracker";
import { createRule } from "../utils/create-rule";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageIds = "missingDollarSuffix";

export interface LibraryConfig {
  /** Track only these functions. If set, `ignores` is ignored. */
  tracks?: string[];
  /** Ignore these functions (track everything else). Only applies when `tracks` is not set. */
  ignores?: string[];
}

export type LibrariesConfig = Record<string, LibraryConfig>;

interface Options {
  libraries: LibrariesConfig;
  allowPattern: string | null;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const USELS_IGNORES: string[] = [
  "get",
  "peek",
  "isRef$",
  "useInitialPick",
  "useDebounceFn",
  "useThrottleFn",
  "useWhenMounted",
  "useRef$",
  "useRafFn",
  "useIntervalFn",
  "useTimeoutFn",
  "useTimeout",
  "useInterval",
  "useCountdown",
  "useComputedWithControl",
];

const defaultLibraries: LibrariesConfig = {
  "@legendapp/state": { tracks: ["observable", "computed"] },
  "@legendapp/state/react": { tracks: ["useObservable", "useObservableState"] },
  "@usels/core": { ignores: USELS_IGNORES },
  "@usels/web": { ignores: USELS_IGNORES },
  "@usels/native": { ignores: USELS_IGNORES },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert `LibrariesConfig` → `TrackFunctionsConfig` for ImportTracker. */
function toTrackFunctionsConfig(libs: LibrariesConfig): TrackFunctionsConfig {
  const result: TrackFunctionsConfig = {};
  for (const [source, config] of Object.entries(libs)) {
    // tracks specified → pass as-is; otherwise [] (track all — ignores handled separately)
    result[source] = config.tracks ?? [];
  }
  return result;
}

/** Build per-source ignore sets. Only applies when `tracks` is NOT set. */
function buildIgnoreMap(libs: LibrariesConfig): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [source, config] of Object.entries(libs)) {
    if (config.ignores?.length && !config.tracks) {
      map.set(source, new Set(config.ignores));
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

export const observableNaming = createRule<[Options], MessageIds>({
  name: "observable-naming",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require variables holding observables to end with `$`.",
    },
    messages: {
      missingDollarSuffix:
        "Variable '{{name}}' holds an observable but does not end with '$'. Rename it to '{{name}}$'.",
    },
    schema: [
      {
        type: "object",
        properties: {
          libraries: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                tracks: {
                  type: "array",
                  items: { type: "string" },
                },
                ignores: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              additionalProperties: false,
            },
          },
          allowPattern: {
            oneOf: [{ type: "string" }, { type: "null" }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      libraries: defaultLibraries,
      allowPattern: null,
    },
  ],
  create(context, [options]) {
    const trackConfig = toTrackFunctionsConfig(options.libraries);
    const ignoreMap = buildIgnoreMap(options.libraries);
    const tracker = new ImportTracker(trackConfig);
    const allowRegex = options.allowPattern ? new RegExp(options.allowPattern) : null;

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        tracker.processImport(node);
      },

      VariableDeclarator(node: TSESTree.VariableDeclarator) {
        // Only check Identifier patterns (skip destructuring)
        if (node.id.type !== "Identifier") return;

        // Must have an initializer that is a CallExpression
        if (!node.init || node.init.type !== "CallExpression") return;

        const call = node.init;

        // The callee must be a simple Identifier (direct function call)
        if (call.callee.type !== "Identifier") return;

        const calleeName = call.callee.name;

        // Check if this function is a tracked import
        if (!tracker.isTracked(calleeName)) return;

        // Check if this function is in the ignore list for its source
        const binding = tracker.getBinding(calleeName);
        if (binding) {
          const sourceIgnores = ignoreMap.get(binding.source);
          if (sourceIgnores?.has(binding.importedName)) return;
        }

        // Skip for...of loop variables: check parent chain
        // VariableDeclarator → VariableDeclaration → ForOfStatement.left
        const varDecl = node.parent; // VariableDeclaration
        const forOfCandidate = varDecl?.parent;
        if (
          forOfCandidate &&
          forOfCandidate.type === "ForOfStatement" &&
          forOfCandidate.left === varDecl
        ) {
          return;
        }

        const varName = node.id.name;

        // Check allowPattern
        if (allowRegex && allowRegex.test(varName)) return;

        // Check for $ suffix
        if (!varName.endsWith("$")) {
          context.report({
            node: node.id,
            messageId: "missingDollarSuffix",
            data: { name: varName },
          });
        }
      },
    };
  },
});
