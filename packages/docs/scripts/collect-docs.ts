#!/usr/bin/env tsx
import * as fs from 'fs/promises'
import * as path from 'path'
import matter from 'gray-matter'

interface DocMetadata {
  title: string
  description?: string
  order?: number
  category?: string
}

interface DocFile {
  sourcePath: string
  targetPath: string
  relativePath: string
  metadata: DocMetadata
  package: 'utils' | 'integrations'
}

const ASTRO_ROOT = process.cwd()
const PACKAGES_ROOT = path.join(ASTRO_ROOT, '..', '..')

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      // Skip excluded directories
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === '__mocks__' || entry.name === 'node_modules') {
          continue
        }
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

async function scanSourceFiles(): Promise<DocFile[]> {
  console.log('📂 Scanning for markdown files...')

  const utilsDir = path.join(PACKAGES_ROOT, 'packages', 'utils', 'src')
  const integrationsDir = path.join(PACKAGES_ROOT, 'packages', 'integrations', 'src')

  const utilsFiles = await findMarkdownFiles(utilsDir)
  const integrationsFiles = await findMarkdownFiles(integrationsDir)

  const allFiles = [...utilsFiles, ...integrationsFiles]
  console.log(`   Found ${allFiles.length} markdown file(s)`)

  const docFiles: DocFile[] = []
  const errors: string[] = []

  for (const sourcePath of allFiles) {
    const content = await fs.readFile(sourcePath, 'utf-8')
    const { data } = matter(content)

    // Validate required frontmatter
    if (!data.title) {
      errors.push(`Missing 'title' in frontmatter: ${sourcePath}`)
      continue
    }

    // Determine package and paths
    const relativeToPackages = path.relative(PACKAGES_ROOT, sourcePath)
    const parts = relativeToPackages.split(path.sep)
    const packageName = parts[1] as 'utils' | 'integrations'

    // Extract filename without extension
    const filename = path.basename(sourcePath, '.md')

    // Target path in Astro content directory
    const targetPath = path.join(ASTRO_ROOT, 'src', 'content', 'docs', packageName, `${filename}.md`)
    const relativePath = `/${packageName}/${filename}`

    docFiles.push({
      sourcePath,
      targetPath,
      relativePath,
      metadata: data as DocMetadata,
      package: packageName
    })
  }

  if (errors.length > 0) {
    console.error('\n❌ Validation errors:')
    errors.forEach(err => console.error(`   ${err}`))
    process.exit(1)
  }

  // Check for duplicate target paths
  const targetPaths = new Map<string, string>()
  const duplicates: string[] = []

  for (const doc of docFiles) {
    const existing = targetPaths.get(doc.targetPath)
    if (existing) {
      duplicates.push(
        `Duplicate target: ${doc.targetPath}\n  Source 1: ${existing}\n  Source 2: ${doc.sourcePath}`
      )
    } else {
      targetPaths.set(doc.targetPath, doc.sourcePath)
    }
  }

  if (duplicates.length > 0) {
    console.error('\n❌ Duplicate target paths:')
    duplicates.forEach(dup => console.error(`   ${dup}`))
    process.exit(1)
  }

  return docFiles
}

async function cleanGeneratedFiles(packageName: string): Promise<void> {
  const targetDir = path.join(ASTRO_ROOT, 'src', 'content', 'docs', packageName)

  try {
    const files = await fs.readdir(targetDir)

    for (const file of files) {
      // Keep index.md, remove everything else
      if (file !== 'index.md') {
        const filePath = path.join(targetDir, file)
        await fs.rm(filePath, { force: true })
      }
    }
  } catch (err) {
    // Directory might not exist yet
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

async function copyDocFiles(docFiles: DocFile[]): Promise<void> {
  console.log('\n📝 Copying documentation files...')

  // Clean existing files
  await cleanGeneratedFiles('utils')
  await cleanGeneratedFiles('integrations')

  let copied = 0

  for (const doc of docFiles) {
    // Ensure target directory exists
    await fs.mkdir(path.dirname(doc.targetPath), { recursive: true })

    // Copy file
    const content = await fs.readFile(doc.sourcePath, 'utf-8')
    await fs.writeFile(doc.targetPath, content, 'utf-8')

    console.log(`   ✅ ${doc.relativePath}`)
    copied++
  }

  console.log(`   Copied ${copied} file(s)`)
}

async function main(): Promise<void> {
  console.log('🚀 Collecting documentation files...\n')

  try {
    const docFiles = await scanSourceFiles()
    await copyDocFiles(docFiles)

    console.log('\n✨ Documentation collection complete!\n')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

main()
