import * as path from 'path'
import type { OutputTarget, SourcePackageName } from './types'

export const ASTRO_ROOT = process.cwd()
export const PACKAGES_ROOT = path.join(ASTRO_ROOT, '..')
export const DOCS_CONTENT_ROOT = path.join(ASTRO_ROOT, 'src', 'content', 'docs')
export const DOCS_TEMPLATES_ROOT = path.join(ASTRO_ROOT, 'src', 'content', 'templates')
export const NATIVE_INDEX_TEMPLATE_PATH = path.join(DOCS_TEMPLATES_ROOT, 'native-index.mdx')
export const NATIVE_INDEX_OUTPUT_PATH = path.join(DOCS_CONTENT_ROOT, 'native', 'index.mdx')
export const DOCS_ENABLE_NATIVE_TAB = process.env.DOCS_ENABLE_NATIVE_TAB === '1'
export const GITHUB_REPO_URL = 'https://github.com/your-org/usels'

export const SOURCE_PACKAGES = [
  { name: 'core', dir: 'core' },
  { name: 'web', dir: 'web' },
  { name: 'native', dir: 'native' },
  { name: 'integrations', dir: 'integrations' },
  { name: 'tanstack-query', dir: 'libraries/tanstack-query' },
] as const

export function getOutputTargets(sourcePackage: SourcePackageName, relativeDocPath: string): OutputTarget[] {
  switch (sourcePackage) {
    case 'core':
      return [{ section: 'core', relativeDocPath }]
    case 'web':
      return [{ section: 'web', relativeDocPath }]
    case 'native':
      return DOCS_ENABLE_NATIVE_TAB
        ? [{ section: 'native', relativeDocPath }]
        : []
    case 'integrations':
      return [{ section: 'integrations', relativeDocPath }]
    case 'tanstack-query':
      return [{ section: 'integrations', relativeDocPath }]
    default:
      return []
  }
}

export function toGeneratedRelativeDocPath(sourcePath: string, sourcePackageDir: string): string {
  const packageSrcRoot = path.join(PACKAGES_ROOT, 'packages', sourcePackageDir, 'src')
  const relativeFromSrc = path.relative(packageSrcRoot, sourcePath)
  const ext = path.extname(relativeFromSrc)
  const dir = path.dirname(relativeFromSrc)
  const rawName = path.basename(relativeFromSrc, ext)

  if (rawName === 'index') {
    const parentName = path.basename(dir)
    const parentDir = path.dirname(dir)
    const normalizedDir = parentDir === '.' ? '' : parentDir
    return path.join(normalizedDir, `${parentName}.md`).split(path.sep).join('/')
  }

  return relativeFromSrc.replace(ext, '.md').split(path.sep).join('/')
}
