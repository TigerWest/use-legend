import legendPlugin from "@usels/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

const files = ["packages/core/src/**/*.ts", "packages/core/src/**/*.tsx"];

const specFiles = [
  "packages/core/src/**/*.spec.ts",
  "packages/core/src/**/*.spec.tsx",
  "packages/core/src/**/*.browser.spec.ts",
];

export default [
  // TypeScript + React Hooks 기본 권장 규칙
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
    },
  },
  // Legend-State 플러그인 규칙
  {
    ...legendPlugin.configs.recommended,
    files,
  },
  // 테스트 파일: no-explicit-any off (테스트에서는 any 자유롭게 사용)
  // reportUnusedDisableDirectives: false — 테스트 파일의 기존 inline disable 주석이 unused로 잡히지 않게
  {
    files: specFiles,
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
