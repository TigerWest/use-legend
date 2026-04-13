import type { NodePath, types as BabelTypes } from "@babel/core";
import type {
  Expression,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadChild,
  JSXText,
} from "@babel/types";
import type { PluginState } from "../types";
import { createAutoElement } from "../utils/createAutoElement";
import { wrapChildrenAsFunction } from "../utils/wrapChildrenAsFunction";
import {
  collectAttributeGetCallSources,
  expressionFromAutoElement,
  getNearestAutoMemoSources,
  isInsideManualMemo,
  isManualMemoElement,
  isSourceSubset,
  registerAutoMemo,
  sourcesEqual,
} from "../utils";
import { isInsideObserverHOC } from "../utils/isInsideObserverHOC";

type JSXChild = JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment;

function expressionToJSXChild(t: typeof BabelTypes, expression: Expression): JSXChild {
  if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
    return expression as JSXElement | JSXFragment;
  }
  return t.jsxExpressionContainer(expression);
}

function getElementName(node: JSXElement): string | null {
  const name = node.openingElement.name;
  return name.type === "JSXIdentifier" ? name.name : null;
}

function getAutoMemoChildSources(child: JSXChild, state: PluginState): Set<string> | null {
  if (child.type !== "JSXElement") return null;
  return state.generatedMemoSources.get(child) ?? null;
}

function mergeRun(t: typeof BabelTypes, run: JSXChild[], state: PluginState): JSXChild[] {
  const autoMemoChildren = run.filter((child) => getAutoMemoChildSources(child, state) !== null);
  const hasMeaningfulText = run.some(
    (child) => child.type === "JSXText" && child.value.trim().length > 0
  );

  if (autoMemoChildren.length === 0 || !hasMeaningfulText) return run;

  const firstSources = getAutoMemoChildSources(autoMemoChildren[0], state);
  if (firstSources === null || firstSources.size === 0) return run;

  for (const child of autoMemoChildren) {
    const sources = getAutoMemoChildSources(child, state);
    if (sources === null || !sourcesEqual(firstSources, sources)) return run;
  }

  const fragmentChildren: JSXChild[] = [];
  for (const child of run) {
    if (child.type !== "JSXElement") {
      fragmentChildren.push(child);
      continue;
    }

    if (getAutoMemoChildSources(child, state) === null) {
      fragmentChildren.push(child);
      continue;
    }

    const expression = expressionFromAutoElement(child);
    if (expression === null) return run;
    fragmentChildren.push(expressionToJSXChild(t, expression));
  }

  const body = t.jsxFragment(
    t.jsxOpeningFragment(),
    t.jsxClosingFragment(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Babel's JSX child union is structurally compatible here.
    fragmentChildren as any[]
  );
  const autoElement = createAutoElement(t, body, state.autoComponentName);
  registerAutoMemo(state, autoElement, firstSources);
  return [autoElement];
}

export function mergeTextRunAutoMemos(
  t: typeof BabelTypes,
  children: JSXChild[],
  state: PluginState
): JSXChild[] {
  const nextChildren: JSXChild[] = [];
  let run: JSXChild[] = [];

  const flush = () => {
    if (run.length > 0) {
      nextChildren.push(...mergeRun(t, run, state));
      run = [];
    }
  };

  for (const child of children) {
    if (child.type === "JSXText" || getAutoMemoChildSources(child, state) !== null) {
      run.push(child);
      continue;
    }

    flush();
    nextChildren.push(child);
  }

  flush();
  return nextChildren;
}

function replaceAutoMemoWithBody(t: typeof BabelTypes, memoPath: NodePath<JSXElement>): void {
  const body = expressionFromAutoElement(memoPath.node);
  if (body === null) return;

  if (memoPath.parentPath.isJSXElement() && memoPath.listKey === "children") {
    memoPath.replaceWith(expressionToJSXChild(t, body));
    return;
  }

  memoPath.replaceWith(body);
}

function pruneNestedAutoMemos(
  t: typeof BabelTypes,
  path: NodePath<JSXElement>,
  state: PluginState,
  parentSources: Set<string>
): void {
  path.traverse({
    ArrowFunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionDeclaration(innerPath) {
      innerPath.skip();
    },

    JSXElement(innerPath) {
      if (isManualMemoElement(innerPath.node, state)) {
        innerPath.skip();
        return;
      }

      const sources = state.generatedMemoSources.get(innerPath.node);
      if (sources === undefined) return;

      if (isSourceSubset(sources, parentSources)) {
        replaceAutoMemoWithBody(t, innerPath as NodePath<JSXElement>);
      }

      innerPath.skip();
    },
  });
}

function transformJSXElement(
  t: typeof BabelTypes,
  path: NodePath<JSXElement>,
  state: PluginState
): void {
  path.node.children = mergeTextRunAutoMemos(t, path.node.children as JSXChild[], state);

  if (isManualMemoElement(path.node, state)) return;
  if (isInsideManualMemo(path, state)) return;
  if (isInsideObserverHOC(path, state.observerNames)) return;

  const attributeSources = collectAttributeGetCallSources(path, state.opts);
  if (attributeSources.size === 0) return;

  const enclosingSources = getNearestAutoMemoSources(path, state);
  if (isSourceSubset(attributeSources, enclosingSources)) return;

  pruneNestedAutoMemos(t, path, state, attributeSources);

  const autoElement = createAutoElement(t, path.node, state.autoComponentName);
  registerAutoMemo(state, autoElement, attributeSources);
  path.replaceWith(autoElement);
}

function wrapReactiveChildrenElement(
  t: typeof BabelTypes,
  path: NodePath<JSXElement>,
  state: PluginState
): void {
  const elementName = getElementName(path.node);
  if (!elementName || !state.autoWrapChildrenComponents.has(elementName)) return;

  const wrapped = wrapChildrenAsFunction(t, path.node);
  if (wrapped !== null) {
    path.replaceWith(wrapped);
  }
}

export function createJSXElementVisitor(t: typeof BabelTypes) {
  return {
    enter(path: NodePath<JSXElement>, state: PluginState): void {
      wrapReactiveChildrenElement(t, path, state);
    },
    exit(path: NodePath<JSXElement>, state: PluginState): void {
      transformJSXElement(t, path, state);
    },
  };
}

export function createJSXFragmentVisitor(t: typeof BabelTypes) {
  return {
    exit(path: NodePath<JSXFragment>, state: PluginState): void {
      path.node.children = mergeTextRunAutoMemos(t, path.node.children as JSXChild[], state);
    },
  };
}
