import type { types as BabelTypes } from '@babel/core';
import type {
  Expression,
  JSXChild,
  JSXElement,
  JSXExpressionContainer,
} from '@babel/types';

/**
 * Expression types that indicate children are already function-like.
 * Wrapping these again would be incorrect.
 *
 * - ArrowFunctionExpression: {() => ...} — already wrapped
 * - FunctionExpression: {function() {...}} — already wrapped
 * - MemberExpression: {obj.render} — already a reference
 * - Identifier: {renderFn} — already a reference
 */
const ALREADY_FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'MemberExpression',
  'Identifier',
]);

/** Strip whitespace-only JSXText nodes (newlines/spaces between tags) */
function filterEmptyText(children: JSXChild[]): JSXChild[] {
  return children.filter(
    (c) => !(c.type === 'JSXText' && c.value.trim().length === 0),
  );
}

/** Check if the (single) child is already a function/reference — no wrapping needed */
function areChildrenAlreadyFunction(children: JSXChild[]): boolean {
  if (children.length !== 1) return false;
  const child = children[0];
  if (child.type !== 'JSXExpressionContainer') return false;
  const expr = (child as JSXExpressionContainer).expression;
  return expr.type !== 'JSXEmptyExpression' && ALREADY_FUNCTION_TYPES.has(expr.type);
}

/**
 * Build the arrow function body from filtered children.
 *
 * - Single JSXElement child  → use it directly as body: () => <Foo />
 * - Single expression child  → unwrap from container: () => someExpr
 * - Multiple children        → wrap in Fragment: () => <><A /><B /></>
 */
function buildArrowBody(
  t: typeof BabelTypes,
  children: JSXChild[],
): Expression {
  if (children.length === 1) {
    const child = children[0];
    if (child.type === 'JSXElement') return child as JSXElement;
    if (child.type === 'JSXExpressionContainer') {
      const expr = (child as JSXExpressionContainer).expression;
      if (expr.type !== 'JSXEmptyExpression') return expr as Expression;
    }
  }
  return t.jsxFragment(
    t.jsxOpeningFragment(),
    t.jsxClosingFragment(),
    children as any[],
  );
}

/**
 * Wraps non-function children of a JSXElement in an arrow function.
 *
 * Before: <Memo>{count$.get()}</Memo>
 * After:  <Memo>{() => count$.get()}</Memo>
 *
 * Returns the new JSXElement node, or null if no transformation is needed
 * (children are already a function, or there are no meaningful children).
 */
export function wrapChildrenAsFunction(
  t: typeof BabelTypes,
  node: JSXElement,
): JSXElement | null {
  // Only handle simple JSXIdentifier element names (not <Foo.Bar> etc.)
  if (node.openingElement.name.type !== 'JSXIdentifier') return null;

  const children = filterEmptyText(node.children);

  if (children.length === 0) return null;
  if (areChildrenAlreadyFunction(children)) return null;

  // Only wrap if first child is a JSXElement or a non-function expression
  const firstChild = children[0];
  const needsWrapping =
    firstChild.type === 'JSXElement' ||
    (firstChild.type === 'JSXExpressionContainer' &&
      !ALREADY_FUNCTION_TYPES.has(
        (firstChild as JSXExpressionContainer).expression.type,
      ));

  if (!needsWrapping) return null;

  const elementName = node.openingElement.name.name;
  const body = buildArrowBody(t, children);
  const arrowFn = t.arrowFunctionExpression([], body);

  return t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(elementName),
      node.openingElement.attributes,
      false,
    ),
    t.jsxClosingElement(t.jsxIdentifier(elementName)),
    [t.jsxExpressionContainer(arrowFn)],
    false,
  );
}
