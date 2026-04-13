import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Expression, JSXExpressionContainer } from "@babel/types";
import type { PluginState } from "../types";
import { isInsideObserverHOC } from "../utils/isInsideObserverHOC";
import { isInsideAttribute } from "../utils/isInsideAttribute";
import { createAutoElement } from "../utils/createAutoElement";
import {
  collectGetCallSources,
  getNearestAutoMemoSources,
  isInsideManualMemo,
  isSourceSubset,
  registerAutoMemo,
  unionSources,
} from "../utils";

function wrapBranchIfNeeded(
  t: typeof BabelTypes,
  branchPath: NodePath<Expression>,
  state: PluginState,
  parentSources: Set<string>
): void {
  splitReactiveBranches(t, branchPath, state, parentSources);

  if (branchPath.isJSXElement() || branchPath.isJSXFragment()) return;

  const branchSources = collectGetCallSources(branchPath, state.opts);
  if (branchSources.size === 0) return;
  if (isSourceSubset(branchSources, parentSources)) return;

  const autoElement = createAutoElement(t, branchPath.node, state.autoComponentName);
  registerAutoMemo(state, autoElement, branchSources);
  branchPath.replaceWith(autoElement);
}

function splitReactiveBranches(
  t: typeof BabelTypes,
  exprPath: NodePath<Expression>,
  state: PluginState,
  inheritedSources: Set<string>
): void {
  if (exprPath.isConditionalExpression()) {
    const testPath = exprPath.get("test") as NodePath<Expression>;
    const parentSources = unionSources(
      inheritedSources,
      collectGetCallSources(testPath, state.opts)
    );

    wrapBranchIfNeeded(t, exprPath.get("consequent") as NodePath<Expression>, state, parentSources);
    wrapBranchIfNeeded(t, exprPath.get("alternate") as NodePath<Expression>, state, parentSources);
    return;
  }

  if (exprPath.isLogicalExpression()) {
    const leftPath = exprPath.get("left") as NodePath<Expression>;
    const parentSources = unionSources(
      inheritedSources,
      collectGetCallSources(leftPath, state.opts)
    );

    wrapBranchIfNeeded(t, exprPath.get("right") as NodePath<Expression>, state, parentSources);
  }
}

export function createJSXExpressionContainerVisitor(t: typeof BabelTypes) {
  return function JSXExpressionContainer(
    path: NodePath<JSXExpressionContainer>,
    state: PluginState
  ): void {
    // 1. Skip if inside a JSXAttribute — JSXElement visitor handles those
    if (isInsideAttribute(path)) return;

    // 2. User-authored Memo is an explicit render boundary; only generated Memo can nest.
    if (isInsideManualMemo(path, state)) return;

    // 3. Skip if inside an observer() HOC
    if (isInsideObserverHOC(path, state.observerNames)) return;

    // 4. Skip JSXEmptyExpression {}
    const expression = path.node.expression;
    if (expression.type === "JSXEmptyExpression") return;

    // 5. Check if the expression contains a .get() call
    const exprPath = path.get("expression") as NodePath;
    splitReactiveBranches(t, exprPath as NodePath<Expression>, state, new Set());

    const sources = collectGetCallSources(exprPath, state.opts);
    if (sources.size === 0) return;

    const enclosingSources = getNearestAutoMemoSources(path, state);
    if (isSourceSubset(sources, enclosingSources)) return;

    // 6. Wrap the expression in <Auto>{() => expression}</Auto>
    const autoElement = createAutoElement(t, expression, state.autoComponentName);
    registerAutoMemo(state, autoElement, sources);
    path.replaceWith(autoElement);
  };
}
