import * as fs from "fs/promises";
import * as path from "path";
import matter from "gray-matter";
import { PACKAGES_ROOT } from "./config";
import { getGitChangelog, getGitContributors, getGitLastChanged } from "./git-helpers";
import { buildAutoSections, serializeFrontmatter } from "./markdown-sections";
import { extractTypeDeclarations } from "./type-declarations";
import type { GeneratedDoc } from "./types";

export async function transformPackageDoc(
  doc: GeneratedDoc
): Promise<{ finalContent: string; hasDemo: boolean }> {
  const sourceContent = await fs.readFile(doc.sourcePath, "utf-8");
  const { data: frontmatter, content: body } = matter(sourceContent);

  const lastChanged = getGitLastChanged(doc.sourcePath);
  const contributors = getGitContributors(doc.sourcePath);
  const changelog = getGitChangelog(doc.sourcePath);

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
  const enhancedFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    package: doc.sourcePackage,
    sourceFile,
  };

  if (lastChanged) enhancedFrontmatter.lastChanged = lastChanged;
  if (contributors.length > 0) enhancedFrontmatter.contributors = contributors;

  delete enhancedFrontmatter.order;

  const autoSections = buildAutoSections({
    typeDeclarations,
    sourceFile,
    contributors,
    changelog,
  });

  const demoPath = path.join(path.dirname(doc.sourcePath), "demo.tsx");
  let hasDemo = false;
  try {
    await fs.access(demoPath);
    hasDemo = true;
  } catch {
    hasDemo = false;
  }

  let finalContent = `---\n${serializeFrontmatter(enhancedFrontmatter)}\n---\n`;

  if (hasDemo) {
    const packageSrcDir = path.join(PACKAGES_ROOT, "packages", doc.sourcePackage, "src");
    const demoRelPath = path
      .relative(packageSrcDir, path.dirname(demoPath))
      .split(path.sep)
      .join("/");
    const demoImportPath = `@demos/${doc.sourcePackage}/${demoRelPath}/demo`;
    finalContent += `\nimport Demo from '${demoImportPath}'\n`;
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
