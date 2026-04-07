import type { Plugin, ViteDevServer } from 'vite'
import * as path from 'path'
import * as fs from 'fs/promises'
import matter from 'gray-matter'
import {
  PACKAGES_ROOT,
  DOCS_CONTENT_ROOT,
  SOURCE_PACKAGES,
  getOutputTargets,
  toGeneratedRelativeDocPath,
} from './collect-docs/config'
import { transformPackageDoc } from './collect-docs/transform-package-doc'
import type { GeneratedDoc, DocMetadata, SourcePackageName } from './collect-docs/types'

function findSourcePackage(filePath: string) {
  return SOURCE_PACKAGES.find(pkg => {
    const pkgSrcRoot = path.join(PACKAGES_ROOT, 'packages', pkg.dir, 'src')
    return filePath.startsWith(pkgSrcRoot)
  })
}

function isSourceDocFile(filePath: string): boolean {
  return (
    (filePath.endsWith('.md') || filePath.endsWith('.mdx')) &&
    findSourcePackage(filePath) != null
  )
}

async function processSourceFile(sourcePath: string): Promise<string[]> {
  const content = await fs.readFile(sourcePath, 'utf-8')
  const { data } = matter(content)

  if (!data.title) return []

  const pkg = findSourcePackage(sourcePath)
  if (!pkg) return []

  const ext = path.extname(sourcePath)
  const basename = path.basename(sourcePath, ext)
  const filename = basename === 'index' ? path.basename(path.dirname(sourcePath)) : basename

  const relativeDocPath = toGeneratedRelativeDocPath(sourcePath, pkg.dir)
  const outputTargets = getOutputTargets(pkg.name as SourcePackageName, relativeDocPath)

  const outputPaths: string[] = []

  for (const target of outputTargets) {
    const targetPath = path.join(DOCS_CONTENT_ROOT, target.section, target.relativeDocPath)
    const relativePath = `/${target.section}/${target.relativeDocPath.replace(/\.gen\.md$/, '')}`

    const generatedDoc: GeneratedDoc = {
      sourcePath,
      sourcePackage: pkg.name as SourcePackageName,
      targetPath,
      relativePath,
      filename,
    }

    const { finalContent } = await transformPackageDoc(generatedDoc)
    const finalPath = targetPath.replace(/\.gen\.md$/, '.gen.mdx')

    await fs.mkdir(path.dirname(finalPath), { recursive: true })
    await fs.writeFile(finalPath, finalContent, 'utf-8')
    outputPaths.push(finalPath)
  }

  return outputPaths
}

export function watchDocsPlugin(): Plugin {
  // Watch source directories directly (not glob patterns — Vite's watcher.add() handles recursion)
  const watchDirs = SOURCE_PACKAGES.map(pkg =>
    path.join(PACKAGES_ROOT, 'packages', pkg.dir, 'src')
  )

  let server: ViteDevServer

  async function handleChange(filePath: string) {
    if (!isSourceDocFile(filePath)) return
    try {
      const outputPaths = await processSourceFile(filePath)
      for (const outputPath of outputPaths) {
        server.watcher.emit('change', outputPath)
      }
      console.log(`📝 [watch-docs] ${path.relative(PACKAGES_ROOT, filePath)}`)
    } catch (err) {
      console.error(`❌ [watch-docs] Failed to process ${filePath}:`, err)
    }
  }

  async function handleAddUnlink(filePath: string) {
    if (!isSourceDocFile(filePath)) return
    try {
      await processSourceFile(filePath)
      server.hot.send({ type: 'full-reload' })
    } catch {
      // unlink — file may no longer exist
    }
  }

  return {
    name: 'vite-plugin-watch-docs',
    apply: 'serve',
    configureServer(devServer) {
      server = devServer
      server.watcher.add(watchDirs)
      console.log(`👀 [watch-docs] Watching:\n${watchDirs.map(d => `   ${path.relative(PACKAGES_ROOT, d)}`).join('\n')}`)
      server.watcher.on('change', handleChange)
      server.watcher.on('add', handleAddUnlink)
      server.watcher.on('unlink', handleAddUnlink)
    },
  }
}
