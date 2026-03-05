import * as fs from 'fs/promises'
import * as path from 'path'
import { transformPackageDoc } from './transform-package-doc'
import type { GeneratedDoc } from './types'

export async function writePackageDocs(generatedDocs: GeneratedDoc[]): Promise<void> {
  console.log('\n📝 Transforming and writing package documentation files...')

  let written = 0

  for (const doc of generatedDocs) {
    const { finalContent, hasDemo } = await transformPackageDoc(doc)
    const targetExt = hasDemo ? '.mdx' : '.md'
    const targetPath = doc.targetPath.replace(/\.md$/, targetExt)

    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.writeFile(targetPath, finalContent, 'utf-8')

    console.log(`   ✅ ${doc.relativePath}${hasDemo ? ' (mdx+demo)' : ''}`)
    written++
  }

  console.log(`   Written ${written} package file(s)`)
}
