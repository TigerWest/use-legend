import type { NodePath } from "@babel/core";
import type { JSXElement } from "@babel/types";
import type { PluginState } from "../types";

function getJSXIdentifierName(node: JSXElement): string | null {
  const name = node.openingElement.name;
  return name.type === "JSXIdentifier" ? name.name : null;
}

export function isAutoMemoElement(node: JSXElement, state: PluginState): boolean {
  return state.generatedMemoSources.has(node);
}

export function isManualMemoElement(node: JSXElement, state: PluginState): boolean {
  const name = getJSXIdentifierName(node);
  if (name === null) return false;
  if (name !== "Memo" && name !== state.autoComponentName && !state.reactiveComponents.has(name)) {
    return false;
  }
  return !isAutoMemoElement(node, state);
}

export function isInsideManualMemo(path: NodePath, state: PluginState): boolean {
  return (
    path.findParent((p) => {
      if (!p.isJSXElement()) return false;
      return isManualMemoElement(p.node, state);
    }) !== null
  );
}

export function getNearestAutoMemoSources(path: NodePath, state: PluginState): Set<string> | null {
  const memoPath = path.findParent((p) => {
    if (!p.isJSXElement()) return false;
    return isAutoMemoElement(p.node, state);
  });
  if (!memoPath?.isJSXElement()) return null;
  return state.generatedMemoSources.get(memoPath.node) ?? null;
}

export function registerAutoMemo(state: PluginState, node: JSXElement, sources: Set<string>): void {
  state.generatedMemoSources.set(node, new Set(sources));
  state.autoImportNeeded = true;
}
