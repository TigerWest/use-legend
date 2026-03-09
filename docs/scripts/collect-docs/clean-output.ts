import * as fs from 'fs/promises'
import * as path from 'path'
import { DOCS_CONTENT_ROOT } from './config'
import type { OutputSection } from './types'

async function cleanGeneratedFiles(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await cleanGeneratedFiles(entryPath)
        continue
      }
      if (entry.isFile() && /\.gen\.(md|mdx)$/.test(entry.name)) {
        await fs.rm(entryPath, { force: true })
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

export async function cleanSectionDirectory(section: OutputSection): Promise<void> {
  const sectionDir = path.join(DOCS_CONTENT_ROOT, section)
  await cleanGeneratedFiles(sectionDir)
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
