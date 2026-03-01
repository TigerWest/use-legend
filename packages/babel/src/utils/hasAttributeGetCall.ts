import type { NodePath } from "@babel/core";
import type { JSXElement, JSXOpeningElement, JSXAttribute } from "@babel/types";
import type { PluginOptions } from "../types";
import { hasGetCall } from "./hasGetCall";

// React runtime special props — exclude from wrapping detection
// key: list reconciliation would break if Auto has no key
// ref: DOM reference, not reactive tracking
const SPECIAL_PROPS = new Set(["key", "ref"]);

/**
 * Returns true if any non-special JSXAttribute in the JSXElement's opening element
 * contains a zero-argument .get() call.
 * Also handles JSXSpreadAttribute: {...obs$.get()} or {...{ value: obs$.get() }}
 */
export function hasAttributeGetCall(
  jsxElementPath: NodePath<JSXElement>,
  opts: PluginOptions
): boolean {
  const openingEl = jsxElementPath.get("openingElement") as NodePath<JSXOpeningElement>;
  const attributes = openingEl.get("attributes") as NodePath[];

  for (const attrPath of attributes) {
    // Handle spread attributes: {...obs$.get()} or {...{ value: obs$.get() }}
    if (attrPath.isJSXSpreadAttribute()) {
      const argPath = attrPath.get("argument") as NodePath;
      if (hasGetCall(argPath, opts)) return true;
      continue;
    }

    if (!attrPath.isJSXAttribute()) continue;

    // Skip special React props: key, ref
    const attrName = (attrPath.node as JSXAttribute).name;
    if (attrName.type === "JSXIdentifier" && SPECIAL_PROPS.has(attrName.name)) {
      continue;
    }

    const valuePath = attrPath.get("value") as NodePath;
    if (!valuePath.isJSXExpressionContainer()) continue;

    const exprPath = valuePath.get("expression") as NodePath;
    // Skip JSXEmptyExpression ({})
    if (exprPath.isJSXEmptyExpression()) continue;

    if (hasGetCall(exprPath, opts)) return true;
  }

  return false;
}
