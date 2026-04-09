import type { types as BabelTypes } from "@babel/core";
import type { Statement } from "@babel/types";
import type { CollectedProps } from "./collectPropsInScope";

/**
 * Extracts variable binding names from all VariableDeclarations in the list.
 * Bare call statements (e.g. onMount(...)) are included in the factory body
 * but do NOT contribute bindings to the return object / outer destructure.
 */
export function extractBindings(declarations: Statement[], t: typeof BabelTypes): string[] {
  const seen = new Set<string>();
  const bindings: string[] = [];

  for (const stmt of declarations) {
    if (t.isVariableDeclaration(stmt)) {
      for (const decl of stmt.declarations) {
        if (!t.isVoidPattern?.(decl.id)) {
          collectPatternBindings(decl.id as import("@babel/types").LVal, t, seen, bindings);
        }
      }
    } else if (t.isFunctionDeclaration(stmt) && stmt.id) {
      if (!seen.has(stmt.id.name)) {
        seen.add(stmt.id.name);
        bindings.push(stmt.id.name);
      }
    }
    // ExpressionStatements (onMount, observe, etc.) — no binding to extract
  }

  return bindings;
}

function collectPatternBindings(
  node: import("@babel/types").LVal,
  t: typeof BabelTypes,
  seen: Set<string>,
  bindings: string[]
): void {
  if (t.isIdentifier(node)) {
    if (!seen.has(node.name)) {
      seen.add(node.name);
      bindings.push(node.name);
    }
  } else if (t.isObjectPattern(node)) {
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop))
        collectPatternBindings(prop.value as import("@babel/types").LVal, t, seen, bindings);
      else if (t.isRestElement(prop)) collectPatternBindings(prop.argument, t, seen, bindings);
    }
  } else if (t.isArrayPattern(node)) {
    for (const el of node.elements) {
      if (el && !t.isVoidPattern?.(el))
        collectPatternBindings(el as import("@babel/types").LVal, t, seen, bindings);
    }
  }
}

/**
 * Builds:
 *   const { a, b } = useScope(() => {
 *     [declarations]
 *     return { a, b }
 *   })
 *
 * If no bindings (only bare calls): useScope(() => { [declarations] })  — expression statement
 *
 * When propsInfoList is provided, the factory receives props params and useScope
 * receives rest arguments with the props objects/identifiers.
 */
export function buildUseScopeDeclaration(
  t: typeof BabelTypes,
  declarations: Statement[],
  bindings: string[],
  propsInfoList: CollectedProps[]
): Statement {
  const usedInfos = propsInfoList.filter((p) => p.used);
  const hasProps = usedInfos.length > 0;

  const factoryParams = hasProps ? usedInfos.map((info) => t.identifier(info.factoryParam)) : [];
  const secondArgs = hasProps ? usedInfos.map((info) => buildSecondArg(t, info)) : [];

  if (bindings.length === 0) {
    // Only bare calls — expression statement
    const factory = t.arrowFunctionExpression(factoryParams, t.blockStatement(declarations));
    const callArgs = hasProps ? [factory, ...secondArgs] : [factory];
    return t.expressionStatement(t.callExpression(t.identifier("useScope"), callArgs));
  }

  // Has bindings — const destructure
  const returnProps = bindings.map((name) =>
    t.objectProperty(t.identifier(name), t.identifier(name), false, true)
  );
  const factory = t.arrowFunctionExpression(
    factoryParams,
    t.blockStatement([...declarations, t.returnStatement(t.objectExpression(returnProps))])
  );

  const callArgs = hasProps ? [factory, ...secondArgs] : [factory];

  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.objectPattern(
        bindings.map((name) =>
          t.objectProperty(t.identifier(name), t.identifier(name), false, true)
        )
      ),
      t.callExpression(t.identifier("useScope"), callArgs)
    ),
  ]);
}

/**
 * Builds (for hooks):
 *   return useScope(() => {
 *     [declarations]
 *     [finalReturn]
 *   })
 *
 * When propsInfoList is provided:
 *   return useScope((p0, p1) => { ... }, arg0, arg1)
 */
export function buildUseScopeReturn(
  t: typeof BabelTypes,
  declarations: Statement[],
  finalReturn: import("@babel/types").ReturnStatement | undefined,
  propsInfoList: CollectedProps[]
): import("@babel/types").ReturnStatement {
  const usedInfos = propsInfoList.filter((p) => p.used);
  const hasProps = usedInfos.length > 0;
  const factoryParams = hasProps ? usedInfos.map((info) => t.identifier(info.factoryParam)) : [];
  const secondArgs = hasProps ? usedInfos.map((info) => buildSecondArg(t, info)) : [];

  const factoryBody = [...declarations, ...(finalReturn ? [finalReturn] : [])];

  const factory = t.arrowFunctionExpression(factoryParams, t.blockStatement(factoryBody));
  const callArgs: import("@babel/types").Expression[] = hasProps
    ? [factory, ...secondArgs]
    : [factory];

  return t.returnStatement(t.callExpression(t.identifier("useScope"), callArgs));
}

function buildSecondArg(
  t: typeof BabelTypes,
  propsInfo: CollectedProps
): import("@babel/types").Expression {
  if (propsInfo.kind === "identifier") {
    // (props) → pass props as second arg
    return t.identifier(propsInfo.entries[0].local);
  }
  // kind === 'object' — build { count, title } or { count: cnt }
  // Exclude rest entries; they never appear in second arg
  const props = propsInfo.entries
    .filter((e) => !e.rest)
    .map((e) =>
      t.objectProperty(
        t.identifier(e.key!),
        t.identifier(e.local),
        false,
        e.key === e.local // shorthand if key === local
      )
    );
  return t.objectExpression(props);
}
