import * as fs from 'fs/promises'
import * as path from 'path'
import { DOCS_CONTENT_ROOT } from './config'
import type { OutputSection } from './types'

export async function cleanSectionDirectory(section: OutputSection): Promise<void> {
  const sectionDir = path.join(DOCS_CONTENT_ROOT, section)

  try {
    const entries = await fs.readdir(sectionDir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(sectionDir, entry.name)
      if (entry.isDirectory()) {
        await fs.rm(entryPath, { force: true, recursive: true })
        continue
      }

      const isManualIndex = entry.isFile() && (entry.name === 'index.md' || entry.name === 'index.mdx')
      if (!isManualIndex) {
        await fs.rm(entryPath, { force: true })
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

export async function cleanLegacyDirectories(): Promise<void> {
  const legacyDirs = [
    path.join(DOCS_CONTENT_ROOT, 'web', 'core'),
    path.join(DOCS_CONTENT_ROOT, 'web', 'web'),
    path.join(DOCS_CONTENT_ROOT, 'native', 'core'),
    path.join(DOCS_CONTENT_ROOT, 'native', 'native'),
  ]
  for (const dirPath of legacyDirs) {
    await fs.rm(dirPath, { force: true, recursive: true })
  }
}
