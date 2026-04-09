export interface DocMetadata {
  title: string
  description?: string
  order?: number
  category?: string
  package?: string
  sourceFile?: string
}

export type SourcePackageName = 'core' | 'web' | 'native' | 'integrations' | 'tanstack-query'

export type OutputSection = 'core' | 'web' | 'native' | 'integrations' | 'tanstack-query'

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

export interface FunctionSignature {
  name: string;
  description?: string;
  typeParameters?: string;
  params: ParamInfo[];
  returns: ReturnInfo;
  paramChildren?: ChildTypeInfo[];
  returnChildren?: ChildTypeInfo[];
}

export interface ParamInfo {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  properties?: PropertyInfo[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ReturnInfo {
  type: string;
  description?: string;
  properties?: PropertyInfo[];
}

export interface ChildTypeInfo {
  name: string;
  properties: PropertyInfo[];
}
