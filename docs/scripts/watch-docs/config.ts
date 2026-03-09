import * as path from 'path'

const ASTRO_ROOT = process.cwd()
const PACKAGES_ROOT = path.join(ASTRO_ROOT, '..')
const DOCS_ENABLE_NATIVE_TAB = process.env.DOCS_ENABLE_NATIVE_TAB === '1'

const PACKAGES = [
  { name: 'core', dir: 'core' },
  { name: 'web', dir: 'web' },
  ...(DOCS_ENABLE_NATIVE_TAB ? [{ name: 'native', dir: 'native' }] : []),
  { name: 'integrations', dir: 'integrations' },
  { name: 'tanstack-query', dir: 'libraries/tanstack-query' },
] as const

const watchPatterns = PACKAGES.flatMap(pkg => [
  path.join(PACKAGES_ROOT, 'packages', pkg.dir, 'src', '**/*.{md,mdx}'),
  path.join(PACKAGES_ROOT, 'packages', pkg.dir, 'src', '**/demo.tsx'),
]).concat(path.join(ASTRO_ROOT, 'src', 'content', 'docs', 'guides', '**/*.{md,mdx}'))

const ignorePatterns = [
  path.join(PACKAGES_ROOT, 'packages', '*', 'src', '**', '__tests__', '**'),
  path.join(PACKAGES_ROOT, 'packages', '*', 'src', '**', '__mocks__', '**'),
  'node_modules',
]

export const watchDocsConfig = {
  ASTRO_ROOT,
  PACKAGES_ROOT,
  DOCS_ENABLE_NATIVE_TAB,
  watchPatterns,
  ignorePatterns,
  DEBOUNCE_MS: 500,
}
