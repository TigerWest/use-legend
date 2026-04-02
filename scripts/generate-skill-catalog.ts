import * as fs from 'fs/promises'
import * as path from 'path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const OUTPUT = path.join(ROOT, '.claude/skills/use-legend/hook-catalog.md')

const CATEGORY_MAP: Record<string, string> = {
  sensors: 'Sensors',
  browser: 'Browser',
  elements: 'Elements',
  sync: 'Sync',
  utilities: 'Utilities',
  reactivity: 'Reactivity',
  state: 'State',
  observe: 'Observe',
  timer: 'Timer',
}

const PACKAGES = [
  { glob: path.join(ROOT, 'packages/core/src'), name: '@usels/core' },
  { glob: path.join(ROOT, 'packages/web/src'), name: '@usels/web' },
]

interface HookEntry {
  title: string
  description: string
  category: string
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  async function walk(current: string) {
    let entries: Awaited<ReturnType<typeof fs.readdir>>
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === '__mocks__') continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name === 'index.md') {
        files.push(full)
      }
    }
  }
  await walk(dir)
  return files
}

async function main() {
  const grouped: Record<string, Record<string, HookEntry[]>> = {}

  for (const pkg of PACKAGES) {
    const files = await findMarkdownFiles(pkg.glob)
    grouped[pkg.name] = {}

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const { data } = matter(content)

      if (!data.title) continue

      const rawCategory = (data.category as string | undefined) ?? ''
      const category = CATEGORY_MAP[rawCategory.toLowerCase()] ?? rawCategory

      if (!grouped[pkg.name][category]) {
        grouped[pkg.name][category] = []
      }

      grouped[pkg.name][category].push({
        title: data.title as string,
        description: (data.description as string | undefined) ?? '',
      } as HookEntry & { category: string })
    }
  }

  const lines: string[] = []
  const timestamp = new Date().toISOString()
  let total = 0

  lines.push('# use-legend Hook Catalog', '')
  lines.push('> Auto-generated from source frontmatter. Do not edit manually.')
  lines.push('> Run `npx tsx scripts/generate-skill-catalog.ts` to regenerate.')
  lines.push(`> Last updated: ${timestamp}`, '')

  for (const pkg of PACKAGES) {
    const pkgName = pkg.name
    const categories = grouped[pkgName]
    if (!categories || Object.keys(categories).length === 0) continue

    lines.push(`## ${pkgName}`, '')

    const sortedCategories = Object.keys(categories).sort()
    for (const category of sortedCategories) {
      const hooks = categories[category].sort((a, b) => a.title.localeCompare(b.title))
      lines.push(`### ${category} (${hooks.length} hooks)`, '')
      lines.push('| Hook | Description |')
      lines.push('|------|-------------|')
      for (const hook of hooks) {
        const desc = hook.description.replace(/\n/g, ' ').replace(/\|/g, '\\|')
        lines.push(`| \`${hook.title}\` | ${desc} |`)
        total++
      }
      lines.push('')
    }
  }

  lines.push('---')
  lines.push(`Total: ${total} hooks`)

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
  await fs.writeFile(OUTPUT, lines.join('\n'), 'utf-8')
  console.log(`Generated: ${OUTPUT}`)
  console.log(`Total: ${total} hooks`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
