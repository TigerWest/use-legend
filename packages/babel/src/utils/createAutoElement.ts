import type { types as BabelTypes } from '@babel/core';
import type { Expression, JSXElement } from '@babel/types';

/**
 * Creates an AST node for: <ComponentName>{() => expression}</ComponentName>
 *
 * Used to wrap observable .get() expressions in a reactive boundary.
 */
export function createAutoElement(
  t: typeof BabelTypes,
  expression: Expression | JSXElement,
  componentName: string,
): JSXElement {
  const arrowFn = t.arrowFunctionExpression([], expression as Expression);
  const jsxExpr = t.jsxExpressionContainer(arrowFn);

  const openTag = t.jsxOpeningElement(t.jsxIdentifier(componentName), []);
  const closeTag = t.jsxClosingElement(t.jsxIdentifier(componentName));

  return t.jsxElement(openTag, closeTag, [jsxExpr], false);
}
