import type { NodePath, PluginObj, types as BabelTypes } from "@babel/core";
import { transformSync } from "@babel/core";
import type {
  Expression,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXSpreadChild,
  JSXText,
} from "@babel/types";
import { describe, expect, it } from "vitest";
import plugin from "../../src";

type JSXChild = JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment | Expression;

function createJsxLoweringProbe({ types: t }: { types: typeof BabelTypes }): PluginObj {
  const childToExpression = (child: JSXChild): Expression => {
    if (t.isJSXText(child)) return t.stringLiteral(child.value);
    if (t.isJSXExpressionContainer(child)) {
      return t.isJSXEmptyExpression(child.expression)
        ? t.identifier("undefined")
        : child.expression;
    }
    if (t.isExpression(child)) return child;
    return t.identifier("undefined");
  };

  const nameToExpression = (name: JSXElement["openingElement"]["name"]): Expression => {
    if (t.isJSXIdentifier(name)) {
      return /^[a-z]/.test(name.name) ? t.stringLiteral(name.name) : t.identifier(name.name);
    }
    return t.stringLiteral("unknown");
  };

  return {
    name: "jsx-lowering-probe",
    visitor: {
      JSXFragment: {
        exit(path: NodePath<JSXFragment>) {
          path.replaceWith(
            t.callExpression(t.identifier("_Fragment"), path.node.children.map(childToExpression))
          );
        },
      },
      JSXElement: {
        exit(path: NodePath<JSXElement>) {
          path.replaceWith(
            t.callExpression(t.identifier("_jsx"), [
              nameToExpression(path.node.openingElement.name),
              ...path.node.children.map(childToExpression),
            ])
          );
        },
      },
    },
  };
}

describe("autoWrap JSX transform order", () => {
  it("wraps manual Memo fragment children before JSX lowering plugins run", () => {
    const result = transformSync(
      `
        function App() {
          return <Memo><><span>{count$.get()}</span></></Memo>;
        }
      `,
      {
        filename: "memo-fragment-order.tsx",
        configFile: false,
        babelrc: false,
        plugins: ["@babel/plugin-syntax-jsx", [plugin, {}], createJsxLoweringProbe],
      }
    );

    expect(result?.code).toContain(
      'return _jsx(Memo, () => _Fragment(_jsx("span", count$.get())));'
    );
  });
});
