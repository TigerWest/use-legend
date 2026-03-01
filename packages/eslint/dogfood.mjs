/**
 * Dogfood script — run observable-naming & no-observable-in-jsx against packages/core/src/
 * Usage: node dogfood.mjs
 */
import { ESLint } from 'eslint';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const plugin = (await import('./dist/index.mjs')).default;
const tsParser = require('@typescript-eslint/parser');

const mainRoot = resolve(__dirname, '../..');

const eslint = new ESLint({
  cwd: mainRoot,
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: { 'use-legend': plugin },
      rules: {
        'use-legend/observable-naming': 'error',
        'use-legend/no-observable-in-jsx': 'error',
      },
    },
  ],
});

const results = await eslint.lintFiles(['packages/core/src/**/*.ts', 'packages/core/src/**/*.tsx']);

let pluginErrorCount = 0;
let pluginWarningCount = 0;

for (const result of results) {
  // Only show messages from our plugin rules
  const ourMsgs = result.messages.filter((m) => m.ruleId?.startsWith('use-legend/'));
  if (ourMsgs.length > 0) {
    console.log(`\n${result.filePath}`);
    for (const msg of ourMsgs) {
      const severity = msg.severity === 2 ? 'error' : 'warning';
      console.log(`  ${msg.line}:${msg.column}  ${severity}  ${msg.message}  [${msg.ruleId}]`);
      if (msg.severity === 2) pluginErrorCount++;
      else pluginWarningCount++;
    }
  }
}

console.log(`\n✅ Dogfood complete: ${results.length} files linted`);
console.log(`   use-legend errors: ${pluginErrorCount} | warnings: ${pluginWarningCount}`);

if (pluginErrorCount > 0) {
  console.log('\n⚠️  use-legend rule violations found — check if these are true positives or false positives.');
  process.exit(1);
} else {
  console.log('   No false positives from use-legend rules. 🎉');
}
