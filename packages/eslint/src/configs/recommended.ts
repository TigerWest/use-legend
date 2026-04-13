import type { TSESLint } from "@typescript-eslint/utils";

// Recommended config — core naming and rendering rules.
// Usage in eslint.config.js:
//   import legendPlugin from '@usels/eslint-plugin';
//   export default [legendPlugin.configs.recommended];
//
// NOTE: prefer-show-for-conditional and prefer-for-component use $ suffix as an
//       observable proxy. Accuracy is highest when observable-naming is also active.
export const recommended: TSESLint.FlatConfig.Config = {
  rules: {
    "use-legend/observable-naming": "error",
    "use-legend/no-observable-in-jsx": "error",
    "use-legend/hook-return-naming": "warn",
    "use-legend/prefer-show-for-conditional": "off",
    "use-legend/prefer-for-component": "warn",
    "use-legend/prefer-use-observable": "warn",
    "use-legend/prefer-use-observe": "warn",
    "use-legend/no-get-in-non-reactive": "warn",
    "use-legend/no-hooks-in-scope": "error",
  },
};
