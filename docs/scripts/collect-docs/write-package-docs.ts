import * as fs from 'fs/promises'
import * as path from 'path'
import { transformPackageDoc } from './transform-package-doc'
import type { GeneratedDoc } from './types'

export async function writePackageDocs(generatedDocs: GeneratedDoc[]): Promise<void> {
  console.log('\n📝 Transforming and writing package documentation files...')

  await Promise.all(
    generatedDocs.map(async (doc) => {
      const { finalContent, hasDemo } = await transformPackageDoc(doc)
      const targetExt = '.gen.mdx'
      const targetPath = doc.targetPath.replace(/\.gen\.md$/, targetExt)

      await fs.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.writeFile(targetPath, finalContent, 'utf-8')

      console.log(`   ✅ ${doc.relativePath}${hasDemo ? ' (mdx+demo)' : ''}`)
    })
  )

  console.log(`   Written ${generatedDocs.length} package file(s)`)
}
