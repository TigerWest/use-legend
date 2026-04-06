import type { NodePath } from "@babel/core";
import type { Statement } from "@babel/types";

/**
 * Deep-traverses the function body looking for any ReturnStatement whose
 * parent chain includes one of the scope declaration nodes.
 * Stops descent at nested function boundaries.
 */
export function detectEarlyReturns(fnPath: NodePath, declarationNodes: Set<Statement>): void {
  const bodyPath = fnPath.get("body");
  const singleBodyPath = Array.isArray(bodyPath) ? bodyPath[0] : bodyPath;
  singleBodyPath.traverse({
    ReturnStatement(returnPath: NodePath) {
      let current = returnPath.parentPath;
      while (current && current.node !== fnPath.node) {
        if (declarationNodes.has(current.node as Statement)) {
          throw returnPath.buildCodeFrameError(
            '"use scope": Early return is not allowed inside scope body. ' +
              "Use observable computed values or onMount/onUnmount instead."
          );
        }
        current = current.parentPath;
      }
    },
    FunctionDeclaration(p: NodePath) {
      p.skip();
    },
    FunctionExpression(p: NodePath) {
      p.skip();
    },
    ArrowFunctionExpression(p: NodePath) {
      p.skip();
    },
    ObjectMethod(p: NodePath) {
      p.skip();
    },
    ClassMethod(p: NodePath) {
      p.skip();
    },
  });
}
