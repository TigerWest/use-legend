import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Program } from "@babel/types";

export function addUseScopeImport(
  programPath: NodePath<Program>,
  t: typeof BabelTypes,
  importSource: string
): void {
  const alreadyImported = programPath.node.body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      node.source.value === importSource &&
      node.specifiers.some(
        (s) => t.isImportSpecifier(s) && t.isIdentifier(s.imported, { name: "useScope" })
      )
  );
  if (alreadyImported) return;

  const existingDecl = programPath.node.body.find(
    (node): node is import("@babel/types").ImportDeclaration =>
      t.isImportDeclaration(node) &&
      node.source.value === importSource &&
      node.importKind !== "type" &&
      node.specifiers.some((s) => t.isImportSpecifier(s))
  );

  if (existingDecl) {
    existingDecl.specifiers.push(
      t.importSpecifier(t.identifier("useScope"), t.identifier("useScope"))
    );
    return;
  }

  programPath.unshiftContainer("body", [
    t.importDeclaration(
      [t.importSpecifier(t.identifier("useScope"), t.identifier("useScope"))],
      t.stringLiteral(importSource)
    ),
  ]);
}
