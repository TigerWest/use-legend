import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";
import {
  PACKAGES_ROOT,
  SOURCE_PACKAGES,
  DOCS_DEMOS_ROOT,
  toGeneratedRelativeDocPath,
  resolvePackageEntry,
} from "./config";
import { buildAutoSections, serializeFrontmatter } from "./markdown-sections";
import { extractFunctionSignature, extractNamedTypeProperties, extractRawTypeDeclarations } from "./type-declarations";
import type { FunctionSignature, GeneratedDoc } from "./types";

export async function transformPackageDoc(
  doc: GeneratedDoc
): Promise<{ finalContent: string; hasDemo: boolean }> {
  const sourceContent = await fs.readFile(doc.sourcePath, "utf-8");
  const { data: frontmatter, content: body } = matter(sourceContent);

  // Extract function signature if type-table frontmatter is present
  const typeTableConfig = frontmatter["type-table"] as
    | {
        import: string;
        name: string;
        params?: { children?: string[] };
        returns?: { children?: string[] };
      }
    | undefined;

  let signature: FunctionSignature | null = null;

  if (typeTableConfig) {
    const entryFile = resolvePackageEntry(typeTableConfig.import);
    if (entryFile) {
      signature = extractFunctionSignature(entryFile, typeTableConfig.name);

      // Extract explicitly referenced child types
      if (signature) {
        if (typeTableConfig.params?.children?.length) {
          signature.paramChildren = typeTableConfig.params.children
            .map((name) => extractNamedTypeProperties(entryFile, name))
            .filter((c): c is NonNullable<typeof c> => c !== null);
        }
        if (typeTableConfig.returns?.children?.length) {
          signature.returnChildren = typeTableConfig.returns.children
            .map((name) => extractNamedTypeProperties(entryFile, name))
            .filter((c): c is NonNullable<typeof c> => c !== null);
        }
      }
    }
    if (!signature) {
      console.warn(
        `[type-table] Could not extract signature for "${typeTableConfig.name}" from "${typeTableConfig.import}" in ${doc.sourcePath}`
      );
    }
  }

  const sourceFile = path.relative(PACKAGES_ROOT, doc.sourcePath);
  const sourcePackageConfig = SOURCE_PACKAGES.find((pkg) => pkg.name === doc.sourcePackage);
  const outputSection = sourcePackageConfig?.outputSection ?? doc.sourcePackage;
  const slug = `${outputSection}/${doc.filename}`;
  const enhancedFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    slug,
    package: outputSection,
    sourceFile,
  };

  // Extract raw type declarations if type-declarations frontmatter is present
  const typeDeclarationsConfig = frontmatter["type-declarations"] as
    | { file: string; comments?: boolean }
    | undefined;

  let typeDeclarationsCode: string | null = null;

  if (typeDeclarationsConfig) {
    const docDir = path.dirname(doc.sourcePath);
    const targetFile = path.resolve(docDir, typeDeclarationsConfig.file);
    typeDeclarationsCode =
      extractRawTypeDeclarations(targetFile, typeDeclarationsConfig.comments ?? false) || null;
    if (!typeDeclarationsCode) {
      console.warn(
        `[type-declarations] Could not extract declarations from "${targetFile}" in ${doc.sourcePath}`
      );
    }
  }

  delete enhancedFrontmatter.order;
  delete enhancedFrontmatter["type-table"];
  delete enhancedFrontmatter["type-declarations"];

  const autoSections = buildAutoSections({
    sourceFile,
    signature,
    typeDeclarationsCode,
  });

  const sourcePackageDir = sourcePackageConfig?.dir ?? doc.sourcePackage;
  const demoSection = sourcePackageConfig?.demoSection ?? doc.sourcePackage;
  const relDocPath = toGeneratedRelativeDocPath(doc.sourcePath, sourcePackageDir);
  const relDocDir = path.dirname(relDocPath);
  const demoFileName = `${doc.filename}.tsx`;
  const demoPath = path.join(DOCS_DEMOS_ROOT, demoSection, relDocDir, demoFileName);
  let hasDemo = false;
  try {
    await fs.access(demoPath);
    hasDemo = true;
  } catch {
    hasDemo = false;
  }

  let finalContent = `---\n${serializeFrontmatter(enhancedFrontmatter)}\n---\n`;

  finalContent += `\nimport { CodeTabs } from '@components/CodeTabs'\n`;

  if (hasDemo) {
    const demoRelDir = relDocDir === "." ? "" : relDocDir + "/";
    const demoImportPath = `@demos/${demoSection}/${demoRelDir}${doc.filename}`;
    finalContent += `import Demo from '${demoImportPath}'\n`;
  }

  let processedBody = body.trim();
  if (hasDemo) {
    const sections = processedBody.split(/(?=^## )/m);
    const demoIdx = sections.findIndex((section) => /^## Demo/.test(section));
    if (demoIdx !== -1) {
      sections[demoIdx] = '## Demo\n\n<div class="not-content"><Demo client:load /></div>\n\n';
    }
    processedBody = sections.join("");
  }

  if (doc.sourcePackage === "core") {
    processedBody = processedBody.replaceAll("@usels/core", "@usels/web");
  }

  finalContent += `\n${processedBody}\n`;

  if (autoSections) {
    finalContent += `\n\n${autoSections}\n`;
  }

  return { finalContent, hasDemo };
}
