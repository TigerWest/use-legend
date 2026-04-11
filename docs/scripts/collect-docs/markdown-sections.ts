import { GITHUB_REPO_URL } from './config'
import type { ChildTypeInfo, FunctionSignature } from './types'

export function buildAutoSections(meta: {
  sourceFile: string
  signature?: FunctionSignature | null
  typeDeclarationsCode?: string | null
}): string {
  const sections: string[] = []

  if (meta.signature) {
    sections.push(buildTypeSection(meta.signature))
  } else if (meta.typeDeclarationsCode) {
    sections.push(`## Type\n\n\`\`\`typescript\n${meta.typeDeclarationsCode}\n\`\`\``)
  }

  if (meta.sourceFile) {
    const githubUrl = `${GITHUB_REPO_URL}/blob/main/${meta.sourceFile}`
    sections.push(`## Source\n\n[View on GitHub](${githubUrl})`)
  }

  return sections.join('\n\n')
}

/** Escape a string for use inside a markdown table cell (plain text, not code).
 *  MDX does not parse JSX inside inline code spans (`…`), so we only escape
 *  MDX-significant characters in the plain-text segments between backticks.
 */
function escapeCell(value: string): string {
  // Split on backticks: even indices are plain text, odd indices are inline code spans
  const parts = value.split('`')
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i]
      .replace(/</g, '&lt;')      // MDX parses <T> as JSX — only < needs escaping, not >
      .replace(/\{/g, '&#123;')   // MDX parses {expr} as JSX expression — acorn fails on things like { a: 1, b: 2 }
      .replace(/\}/g, '&#125;')
  }
  return parts
    .join('`')
    .replace(/\n/g, ' ')          // newlines break table rows
    .replace(/\|/g, '\\|')        // pipes break table columns
}

/** Escape a string for use inside backtick code spans in table cells */
function escapeCode(value: string): string {
  return value
    .replace(/\n/g, ' ')          // newlines break table rows
    .replace(/\|/g, '\\|')        // pipes break table columns
}

function buildChildTypeTable(child: ChildTypeInfo): string {
  const parts: string[] = []
  parts.push(`\n### ${escapeCode(child.name)}\n`)
  parts.push('<div class="type-table type-table-options">\n')
  parts.push('| Option | Type | Default | Description |')
  parts.push('|--------|------|---------|-------------|')
  for (const prop of child.properties) {
    parts.push(
      `| \`${escapeCode(prop.name)}\` | \`${escapeCode(prop.type)}\` | \`${escapeCode(prop.defaultValue ?? '-')}\` | ${escapeCell(prop.description ?? '-')} |`
    )
  }
  parts.push('\n</div>')
  return parts.join('\n')
}

function buildTypeSection(sig: FunctionSignature): string {
  const parts: string[] = ['## Type']

  // Parameters table
  if (sig.params.length > 0) {
    parts.push('\n### Parameters\n')
    parts.push('<div class="type-table type-table-params">\n')
    parts.push('| Parameter | Type | Description |')
    parts.push('|-----------|------|-------------|')
    for (const p of sig.params) {
      const opt = p.optional ? ' (optional)' : ''
      parts.push(`| \`${escapeCode(p.name)}\` | \`${escapeCode(p.type)}\`${opt} | ${escapeCell(p.description ?? '-')} |`)
    }
    parts.push('\n</div>')

    // Explicitly referenced param children types (takes priority)
    if (sig.paramChildren?.length) {
      for (const child of sig.paramChildren) {
        parts.push(buildChildTypeTable(child))
      }
    } else {
      // Fallback: auto-detected from DeepMaybeObservable unwrap
      for (const p of sig.params) {
        if (p.properties?.length) {
          parts.push(`\n### ${escapeCode(p.type)}\n`)
          parts.push('<div class="type-table type-table-options">\n')
          parts.push('| Option | Type | Default | Description |')
          parts.push('|--------|------|---------|-------------|')
          for (const prop of p.properties) {
            parts.push(
              `| \`${escapeCode(prop.name)}\` | \`${escapeCode(prop.type)}\` | \`${escapeCode(prop.defaultValue ?? '-')}\` | ${escapeCell(prop.description ?? '-')} |`
            )
          }
          parts.push('\n</div>')
        }
      }
    }
  }

  // Returns
  parts.push('\n### Returns\n')
  if (sig.returns.properties?.length) {
    parts.push(`\`${escapeCode(sig.returns.type)}\`\n`)
    parts.push('<div class="type-table type-table-returns">\n')
    parts.push('| Name | Type | Description |')
    parts.push('|------|------|-------------|')
    for (const p of sig.returns.properties) {
      parts.push(`| \`${escapeCode(p.name)}\` | \`${escapeCode(p.type)}\` | ${escapeCell(p.description ?? '-')} |`)
    }
    parts.push('\n</div>')
  } else {
    parts.push(`\`${escapeCode(sig.returns.type)}\``)
    if (sig.returns.description) {
      parts.push(`\n${escapeCell(sig.returns.description)}`)
    }
  }

  // Explicitly referenced return children types
  if (sig.returnChildren?.length) {
    for (const child of sig.returnChildren) {
      parts.push(buildChildTypeTable(child))
    }
  }

  return parts.join('\n')
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
      lines.push(`${key}: "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`  ${nestedKey}: ${nestedValue}`)
      }
      continue
    }

    lines.push(`${key}: ${JSON.stringify(value)}`)
  }

  return lines.join('\n')
}
