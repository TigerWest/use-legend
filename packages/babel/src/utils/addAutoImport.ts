import type { NodePath, types as BabelTypes } from '@babel/core';
import type { Program } from '@babel/types';
import type { PluginState } from '../types';

/**
 * Adds `import { Memo } from "@legendapp/state/react"` (or configured source/name)
 * to the top of the file, if not already imported.
 */
export function addAutoImport(
  programPath: NodePath<Program>,
  t: typeof BabelTypes,
  state: PluginState,
): void {
  const { autoComponentName, autoImportSource } = state;

  // Check if already imported from the source
  const alreadyImported = programPath.node.body.some((node) => {
    if (!t.isImportDeclaration(node)) return false;
    if (node.source.value !== autoImportSource) return false;
    return node.specifiers.some(
      (s) =>
        t.isImportSpecifier(s) &&
        t.isIdentifier(s.imported, { name: autoComponentName }),
    );
  });

  if (alreadyImported) return;

  const importDecl = t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier(autoComponentName),
        t.identifier(autoComponentName),
      ),
    ],
    t.stringLiteral(autoImportSource),
  );

  programPath.unshiftContainer('body', importDecl);
}
