import legendPlugin from "@usels/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import prettierRecommended from "eslint-plugin-prettier/recommended";

const files = ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"];

const specFiles = [
  "packages/*/src/**/*.spec.ts",
  "packages/*/src/**/*.spec.tsx",
  "packages/*/src/**/*.browser.spec.ts",
];

export default [
  // TypeScript + React Hooks recommended rules
  {
    files,
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Ignore _-prefixed variables (intentionally unused, TypeScript convention)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // Legend-State plugin rules
  {
    ...legendPlugin.configs.recommended,
    files,
  },
  // Test files: allow `any` freely, suppress unused disable directive warnings
  // reportUnusedDisableDirectives: false — prevent existing inline disable comments from being flagged as unused
  {
    files: specFiles,
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "use-legend/prefer-use-observable": "off",
    },
  },
  // Prettier: disable conflicting formatting rules + report prettier violations as ESLint errors
  {
    ...prettierRecommended,
    files,
  },
];
