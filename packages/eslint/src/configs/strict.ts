import type { TSESLint } from "@typescript-eslint/utils";

// Strict config — all rules at error severity
// Usage in eslint.config.js:
//   import legendPlugin from '@usels/eslint-plugin';
//   export default [legendPlugin.configs.strict];
export const strict: TSESLint.FlatConfig.Config = {
  rules: {
    "use-legend/observable-naming": "error",
    "use-legend/no-observable-in-jsx": "error",
    "use-legend/hook-return-naming": "error",
    "use-legend/prefer-show-for-conditional": "error",
    "use-legend/prefer-for-component": "error",
    "use-legend/prefer-use-observable": "error",
    "use-legend/prefer-use-observe": "error",
    "use-legend/no-get-in-non-reactive": "error",
    "use-legend/no-hooks-in-scope": "error",
  },
};
