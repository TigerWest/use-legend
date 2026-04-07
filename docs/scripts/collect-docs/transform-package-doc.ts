import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";
import {
  PACKAGES_ROOT,
  SOURCE_PACKAGES,
  DOCS_DEMOS_ROOT,
  toGeneratedRelativeDocPath,
} from "./config";
import { buildAutoSections, serializeFrontmatter } from "./markdown-sections";
import { extractTypeDeclarations } from "./type-declarations";
import type { GeneratedDoc } from "./types";

export async function transformPackageDoc(
  doc: GeneratedDoc
): Promise<{ finalContent: string; hasDemo: boolean }> {
  const sourceContent = await fs.readFile(doc.sourcePath, "utf-8");
  const { data: frontmatter, content: body } = matter(sourceContent);

  const dir = path.dirname(doc.sourcePath);
  const basename = doc.filename;
  const possibleTsFiles = [
    path.join(dir, `${basename}.ts`),
    path.join(dir, `${basename}.tsx`),
    path.join(dir, "index.ts"),
    path.join(dir, "index.tsx"),
  ];

  let typeDeclarations = "";
  for (const tsFile of possibleTsFiles) {
    try {
      await fs.access(tsFile);
      typeDeclarations = extractTypeDeclarations(tsFile);
      break;
    } catch {
      // file does not exist
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

  delete enhancedFrontmatter.order;

  const autoSections = buildAutoSections({
    typeDeclarations,
    sourceFile,
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
