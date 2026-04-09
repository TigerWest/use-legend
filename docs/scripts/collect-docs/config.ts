import * as path from "path";
import type { OutputSection, OutputTarget, SourcePackageName } from "./types";

export const ASTRO_ROOT = process.cwd();
export const PACKAGES_ROOT = path.join(ASTRO_ROOT, "..");
export const DOCS_CONTENT_ROOT = path.join(ASTRO_ROOT, "src", "content", "docs");
export const DOCS_TEMPLATES_ROOT = path.join(ASTRO_ROOT, "src", "content", "templates");
export const DOCS_DEMOS_ROOT = path.join(ASTRO_ROOT, "src", "components", "demos");
export const NATIVE_INDEX_TEMPLATE_PATH = path.join(DOCS_TEMPLATES_ROOT, "native-index.mdx");
export const NATIVE_INDEX_OUTPUT_PATH = path.join(DOCS_CONTENT_ROOT, "native", "index.mdx");
export const DOCS_ENABLE_NATIVE_TAB = process.env.DOCS_ENABLE_NATIVE_TAB === "1";
export const GITHUB_REPO_URL = "https://github.com/TigerWest/use-legend";

export const SOURCE_PACKAGES = [
  { name: "core", dir: "core", demoSection: "core", outputSection: "core" as OutputSection },
  { name: "web", dir: "web", demoSection: "web", outputSection: "web" as OutputSection },
  {
    name: "native",
    dir: "native",
    demoSection: "native",
    outputSection: "native" as OutputSection,
  },
  {
    name: "integrations",
    dir: "integrations",
    demoSection: "integrations",
    outputSection: "integrations" as OutputSection,
  },
  {
    name: "tanstack-query",
    dir: "libraries/tanstack-query",
    demoSection: "tanstack-query",
    outputSection: "tanstack-query" as OutputSection,
  },
] as const;

export function getOutputTargets(
  sourcePackage: SourcePackageName,
  relativeDocPath: string
): OutputTarget[] {
  const pkg = SOURCE_PACKAGES.find((p) => p.name === sourcePackage);
  if (!pkg) return [];

  if (sourcePackage === "native" && !DOCS_ENABLE_NATIVE_TAB) return [];

  return [{ section: pkg.outputSection, relativeDocPath }];
}

export function toGeneratedRelativeDocPath(sourcePath: string, sourcePackageDir: string): string {
  const packageSrcRoot = path.join(PACKAGES_ROOT, "packages", sourcePackageDir, "src");
  const relativeFromSrc = path.relative(packageSrcRoot, sourcePath);
  const ext = path.extname(relativeFromSrc);
  const dir = path.dirname(relativeFromSrc);
  const rawName = path.basename(relativeFromSrc, ext);

  if (rawName === "index") {
    const parentName = path.basename(dir);
    const parentDir = path.dirname(dir);
    const normalizedDir = parentDir === "." ? "" : parentDir;
    return path.join(normalizedDir, `${parentName}.gen.md`).split(path.sep).join("/");
  }

  return relativeFromSrc.replace(ext, ".gen.md").split(path.sep).join("/");
}

export const PACKAGE_ENTRIES: Record<string, string> = {
  "@usels/core": path.resolve(PACKAGES_ROOT, "packages/core/src/index.ts"),
  "@usels/web": path.resolve(PACKAGES_ROOT, "packages/web/src/index.ts"),
  "@usels/integrations": path.resolve(PACKAGES_ROOT, "packages/integrations/src/index.ts"),
  "@usels/tanstack-query": path.resolve(PACKAGES_ROOT, "packages/libraries/tanstack-query/src/index.ts"),
};

export function resolvePackageEntry(packageName: string): string | null {
  return PACKAGE_ENTRIES[packageName] ?? null;
}
