import * as fs from 'fs/promises'
import * as path from 'path'
import matter from 'gray-matter'
import { PACKAGES_ROOT, SOURCE_PACKAGES, getOutputTargets, toGeneratedRelativeDocPath } from './config'
import type { DocMetadata, SourceDoc, SourcePackageName } from './types'

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === '__mocks__' || entry.name === 'node_modules') {
          continue
        }
        await walk(fullPath)
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        files.push(fullPath)
      }
    }
  }

  try {
    await walk(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  return files
}

export async function scanSourceFiles(): Promise<SourceDoc[]> {
  console.log('📂 Scanning for markdown files...')

  const allSourceFiles = (
    await Promise.all(
      SOURCE_PACKAGES.map(pkg =>
        findMarkdownFiles(path.join(PACKAGES_ROOT, 'packages', pkg.dir, 'src'))
      )
    )
  ).flat()

  console.log(`   Found ${allSourceFiles.length} markdown file(s) in package sources`)

  const sourceDocs: SourceDoc[] = []
  const errors: string[] = []

  for (const sourcePath of allSourceFiles) {
    const content = await fs.readFile(sourcePath, 'utf-8')
    const { data } = matter(content)

    if (!data.title) {
      errors.push(`Missing 'title' in frontmatter: ${sourcePath}`)
      continue
    }

    const relativeToPackages = path.relative(PACKAGES_ROOT, sourcePath)
    const parts = relativeToPackages.split(path.sep)
    const sourcePackage = parts[1] as SourcePackageName
    const sourcePackageDir = SOURCE_PACKAGES.find(pkg => pkg.name === sourcePackage)?.dir

    if (!sourcePackageDir) {
      errors.push(`Unknown package for source file: ${sourcePath}`)
      continue
    }

    const relativeDocPath = toGeneratedRelativeDocPath(sourcePath, sourcePackageDir)
    const outputTargets = getOutputTargets(sourcePackage, relativeDocPath)
    const ext = path.extname(sourcePath)
    const filename = path.basename(sourcePath, ext) === 'index'
      ? path.basename(path.dirname(sourcePath))
      : path.basename(sourcePath, ext)

    sourceDocs.push({
      sourcePath,
      sourcePackage,
      outputTargets,
      metadata: data as DocMetadata,
      filename,
    })
  }

  if (errors.length > 0) {
    console.error('\n❌ Validation errors:')
    errors.forEach(err => console.error(`   ${err}`))
    process.exit(1)
  }

  return sourceDocs
}
