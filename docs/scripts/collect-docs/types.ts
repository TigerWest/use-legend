export interface DocMetadata {
  title: string
  description?: string
  order?: number
  category?: string
  package?: string
  sourceFile?: string
}

export type SourcePackageName = 'core' | 'web' | 'native' | 'integrations' | 'tanstack-query'

export type OutputSection = 'core' | 'web' | 'native' | 'integrations'

export interface OutputTarget {
  section: OutputSection
  relativeDocPath: string
}

export interface SourceDoc {
  sourcePath: string
  sourcePackage: SourcePackageName
  outputTargets: OutputTarget[]
  metadata: DocMetadata
  filename: string
}

export interface GeneratedDoc {
  sourcePath: string
  sourcePackage: SourcePackageName
  targetPath: string
  relativePath: string
  filename: string
}
