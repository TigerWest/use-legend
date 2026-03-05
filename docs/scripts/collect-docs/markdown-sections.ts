import { GITHUB_REPO_URL } from './config'
import type { ChangelogEntry, Contributor } from './types'

export function buildAutoSections(meta: {
  typeDeclarations: string
  sourceFile: string
  contributors: Contributor[]
  changelog: ChangelogEntry[]
}): string {
  const sections: string[] = []

  if (meta.typeDeclarations) {
    sections.push(`## Type Declarations\n\n\`\`\`typescript\n${meta.typeDeclarations}\n\`\`\``)
  }

  if (meta.sourceFile) {
    const githubUrl = `${GITHUB_REPO_URL}/blob/main/${meta.sourceFile}`
    sections.push(`## Source\n\n[View on GitHub](${githubUrl})`)
  }

  if (meta.contributors.length > 0) {
    const list = meta.contributors.map(c => `- ${c.name}`).join('\n')
    sections.push(`## Contributors\n\n${list}`)
  }

  if (meta.changelog.length > 0) {
    const list = meta.changelog
      .map(e => `- \`${e.hash}\` ${e.date.slice(0, 10)} - ${e.message} (${e.author})`)
      .join('\n')
    sections.push(`## Changelog\n\n${list}`)
  }

  return sections.join('\n\n')
}

export function serializeFrontmatter(frontmatter: Record<string, unknown>): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const entries = Object.entries(item as Record<string, string>)
          if (entries.length === 0) {
            lines.push('  - {}')
            continue
          }
          lines.push(`  - ${entries[0][0]}: ${entries[0][1]}`)
          for (const [nestedKey, nestedValue] of entries.slice(1)) {
            lines.push(`    ${nestedKey}: ${nestedValue}`)
          }
        } else {
          lines.push(`  - ${item}`)
        }
      }
      continue
    }

    if (typeof value === 'string') {
      lines.push(`${key}: ${value}`)
      continue
    }

    lines.push(`${key}: ${JSON.stringify(value)}`)
  }

  return lines.join('\n')
}
