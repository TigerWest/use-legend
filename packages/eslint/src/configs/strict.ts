import type { TSESLint } from "@typescript-eslint/utils";

// Strict config — all Phase 1 + Phase 2 rules at error severity
// Phase 3 rules (no-get-in-non-reactive, no-peek-in-reactive) will be added after implementation.
// Usage in eslint.config.js:
//   import legendPlugin from '@usels/eslint-plugin';
//   export default [legendPlugin.configs.strict];
export const strict: TSESLint.FlatConfig.Config = {
  rules: {
    "use-legend/observable-naming": "error",
    "use-legend/no-observable-in-jsx": "error",
    "use-legend/hook-return-naming": "error",
    "use-legend/no-enable-api": "error",
    "use-legend/no-reactive-hoc": "error",
    "use-legend/prefer-show-for-conditional": "error",
    "use-legend/prefer-for-component": "error",
    "use-legend/prefer-use-observable": "error",
    "use-legend/prefer-use-observe": "error",
  },
};
