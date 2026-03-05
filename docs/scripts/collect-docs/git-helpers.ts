import { execSync } from 'child_process'
import { PACKAGES_ROOT } from './config'
import type { ChangelogEntry, Contributor } from './types'

export function getGitLastChanged(filePath: string): string | null {
  try {
    const result = execSync(`git log -1 --format="%aI" -- "${filePath}"`, {
      cwd: PACKAGES_ROOT,
      encoding: 'utf-8',
    }).trim()
    return result || null
  } catch {
    return null
  }
}

export function getGitContributors(filePath: string): Contributor[] {
  try {
    const output = execSync(`git log --follow --format="%an|%ae" -- "${filePath}"`, {
      cwd: PACKAGES_ROOT,
      encoding: 'utf-8',
    }).trim()
    if (!output) return []
    const seen = new Set<string>()
    return output
      .split('\n')
      .map(line => {
        const [name, email] = line.split('|')
        return { name: name?.trim() ?? '', email: email?.trim() ?? '' }
      })
      .filter(c => c.email && !seen.has(c.email) && seen.add(c.email))
  } catch {
    return []
  }
}

export function getGitChangelog(filePath: string, limit = 10): ChangelogEntry[] {
  try {
    const output = execSync(
      `git log --follow --format="%H|%aI|%s|%an" -${limit} -- "${filePath}"`,
      { cwd: PACKAGES_ROOT, encoding: 'utf-8' }
    ).trim()
    if (!output) return []
    return output.split('\n').map(line => {
      const [hash, date, message, author] = line.split('|')
      return {
        hash: hash?.slice(0, 7) ?? '',
        date: date ?? '',
        message: message ?? '',
        author: author ?? '',
      }
    })
  } catch {
    return []
  }
}
