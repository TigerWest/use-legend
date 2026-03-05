import * as path from 'path'
import { DOCS_CONTENT_ROOT } from './config'
import type { GeneratedDoc, SourceDoc } from './types'

export function toGeneratedDocs(sourceDocs: SourceDoc[]): GeneratedDoc[] {
  const generatedDocs: GeneratedDoc[] = []

  for (const doc of sourceDocs) {
    for (const target of doc.outputTargets) {
      const sectionDir = target.section
      const targetPath = path.join(DOCS_CONTENT_ROOT, sectionDir, target.relativeDocPath)
      const relativePath = `/${sectionDir}/${target.relativeDocPath.replace(/\.md$/, '')}`

      generatedDocs.push({
        sourcePath: doc.sourcePath,
        sourcePackage: doc.sourcePackage,
        targetPath,
        relativePath,
        filename: doc.filename,
      })
    }
  }

  return generatedDocs
}

export function checkDuplicateTargets(generatedDocs: GeneratedDoc[]): void {
  const targetPaths = new Map<string, string>()
  const duplicates: string[] = []

  for (const doc of generatedDocs) {
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
}
