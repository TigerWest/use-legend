import type { TSESLint } from "@typescript-eslint/utils";

// Recommended config — Phase 1 + Phase 2 rules
// Usage in eslint.config.js:
//   import legendPlugin from '@usels/eslint-plugin';
//   export default [legendPlugin.configs.recommended];
//
// NOTE: prefer-show-for-conditional, prefer-for-component, and prefer-use-observe
//       use $ suffix as observable proxy. Accuracy is highest when observable-naming is also active.
export const recommended: TSESLint.FlatConfig.Config = {
  rules: {
    "use-legend/observable-naming": "error",
    "use-legend/no-observable-in-jsx": "error",

    "use-legend/hook-return-naming": "warn",
    "use-legend/no-enable-api": "warn",
    "use-legend/no-reactive-hoc": "warn",
    "use-legend/prefer-show-for-conditional": "warn",
    "use-legend/prefer-for-component": "warn",
    "use-legend/prefer-use-observable": "warn",
    "use-legend/prefer-use-observe": "warn",
  },
};
