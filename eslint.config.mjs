import legendPlugin from '@usels/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

const files = [
  'packages/core/src/**/*.ts',
  'packages/core/src/**/*.tsx',
  'packages/integrations/src/**/*.ts',
  'packages/integrations/src/**/*.tsx',
];

export default [
  // TypeScript + React Hooks 기본 권장 규칙
  {
    files,
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  // Legend-State 플러그인 규칙
  {
    ...legendPlugin.configs.recommended,
    files,
  },
];
