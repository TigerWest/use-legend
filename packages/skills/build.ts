import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import matter from 'gray-matter'
import * as ts from 'typescript'

const ROOT = join(dirname(new URL(import.meta.url).pathname), '../..')
const CORE_SRC = join(ROOT, 'packages/core/src')
const WEB_SRC = join(ROOT, 'packages/web/src')
const OUT_DIR = join(ROOT, 'packages/skills/skills/use-legend-hooks')
const REFS_DIR = join(OUT_DIR, 'references')

// ----- Type extraction (from docs/scripts/collect-docs/type-declarations.ts) -----
function extractTypeDeclarations(sourceFilePath: string): string {
  try {
    let declarationContent = ''
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      declaration: true,
      emitDeclarationOnly: true,
      skipLibCheck: true,
    }
    const host = ts.createCompilerHost(compilerOptions)
    host.writeFile = (_fileName: string, content: string) => {
      if (_fileName.endsWith('.d.ts')) declarationContent = content
    }
    const program = ts.createProgram([sourceFilePath], compilerOptions, host)
    program.emit()
    return declarationContent
      .replace(/\/\*\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .split('\n')
      .filter(line =>
        !line.startsWith('/// ') &&
        !line.trim().startsWith('import ') &&
        line.trim() !== 'export {};' &&
        line.trim() !== ''
      )
      .join('\n')
      .trim()
  } catch {
    return ''
  }
}

// ----- Category normalization -----
function normalizeCategory(raw: string, fallback: string): string {
  const input = (raw || fallback).toLowerCase()
  return input.charAt(0).toUpperCase() + input.slice(1)
}

// ----- Usage extraction -----
function extractUsageSection(body: string): string {
  const match = body.match(/## Usage\n([\s\S]*?)(?=\n## |\n---|\n# |$)/)
  if (!match) return ''
  return match[1]
    .replace(/```tsx? twoslash/g, '```tsx')
    .replace(/\/\/ @noErrors\n/g, '')
    .replace(/\/\/ @[a-zA-Z]+[^\n]*\n/g, '')
    .trim()
}

// ----- Hook discovery -----
interface HookInfo {
  name: string
  description: string
  category: string
  package: string
  usage: string
  types: string
  relativeSource: string
}

function discoverHooks(srcDir: string, pkgName: string): HookInfo[] {
  const hooks: HookInfo[] = []
  const SKIP = new Set(['shared', 'internal', '__tests__', 'components'])

  for (const cat of readdirSync(srcDir, { withFileTypes: true })) {
    if (!cat.isDirectory() || SKIP.has(cat.name)) continue
    const catDir = join(srcDir, cat.name)
    for (const hook of readdirSync(catDir, { withFileTypes: true })) {
      if (!hook.isDirectory()) continue
      const hookDir = join(catDir, hook.name)
      const mdPath = join(hookDir, 'index.md')
      const tsPath = join(hookDir, 'index.ts')
      if (!existsSync(mdPath)) continue

      const raw = readFileSync(mdPath, 'utf-8')
      const { data, content } = matter(raw)

      hooks.push({
        name: data.title || hook.name,
        description: data.description || '',
        category: normalizeCategory(data.category || '', cat.name),
        package: pkgName,
        usage: extractUsageSection(content),
        types: existsSync(tsPath) ? extractTypeDeclarations(tsPath) : '',
        relativeSource: relative(ROOT, hookDir),
      })
    }
  }
  return hooks
}

// ----- Reference file generation -----
function generateReference(hook: HookInfo): string {
  const parts: string[] = [
    `# ${hook.name}`,
    '',
    `> Part of \`${hook.package}\` | Category: ${hook.category}`,
    '',
    '## Overview',
    '',
    hook.description,
    '',
  ]

  if (hook.usage) {
    parts.push('## Usage', '', hook.usage, '')
  }

  if (hook.types) {
    parts.push('## Type Declarations', '', '```typescript', hook.types, '```', '')
  }

  parts.push(
    '## Source',
    '',
    `- Implementation: \`${hook.relativeSource}/index.ts\``,
    `- Documentation: \`${hook.relativeSource}/index.md\``,
  )

  return parts.join('\n')
}

// ----- CATALOG.md generation -----
function generateCatalogMd(hooks: HookInfo[]): string {
  const byPkg: Record<string, Record<string, HookInfo[]>> = {}

  for (const hook of hooks) {
    if (!byPkg[hook.package]) byPkg[hook.package] = {}
    if (!byPkg[hook.package][hook.category]) byPkg[hook.package][hook.category] = []
    byPkg[hook.package][hook.category].push(hook)
  }

  const lines: string[] = [
    '# use-legend Hook Catalog',
    '',
    '> Observable-native React utility hooks built on Legend-State.',
    `> ${hooks.length} hooks across 2 packages: \`@usels/core\` and \`@usels/web\`.`,
    '',
    '> Auto-generated. Run `pnpm --filter @usels/skills build` to regenerate.',
    '',
  ]

  for (const pkg of ['@usels/core', '@usels/web']) {
    if (!byPkg[pkg]) continue
    lines.push(`## ${pkg}`, '')
    for (const cat of Object.keys(byPkg[pkg]).sort()) {
      const catHooks = byPkg[pkg][cat].sort((a, b) => a.name.localeCompare(b.name))
      lines.push(`### ${cat} (${catHooks.length} hooks)`, '')
      lines.push('| Hook | Description | Reference |')
      lines.push('|------|-------------|-----------|')
      for (const h of catHooks) {
        const desc = h.description.length > 100
          ? h.description.slice(0, 97) + '...'
          : h.description
        lines.push(`| [\`${h.name}\`](references/${h.name}.md) | ${desc} | AUTO |`)
      }
      lines.push('')
    }
  }

  lines.push(`---`, `Total: ${hooks.length} hooks`)
  return lines.join('\n')
}

// ----- Main -----
console.log('Discovering hooks...')
const coreHooks = discoverHooks(CORE_SRC, '@usels/core')
const webHooks = discoverHooks(WEB_SRC, '@usels/web')
const allHooks = [...coreHooks, ...webHooks]
console.log(`Found ${coreHooks.length} core hooks, ${webHooks.length} web hooks = ${allHooks.length} total`)

mkdirSync(REFS_DIR, { recursive: true })

console.log('Generating reference files...')
for (const hook of allHooks) {
  const refPath = join(REFS_DIR, `${hook.name}.md`)
  writeFileSync(refPath, generateReference(hook), 'utf-8')
}
console.log(`Generated ${allHooks.length} reference files`)

console.log('Generating CATALOG.md...')
writeFileSync(join(OUT_DIR, 'CATALOG.md'), generateCatalogMd(allHooks), 'utf-8')

console.log('Done!')
