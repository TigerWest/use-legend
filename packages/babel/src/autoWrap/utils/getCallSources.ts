import type { NodePath } from "@babel/core";
import type {
  CallExpression,
  Expression,
  Identifier,
  JSXElement,
  Node,
  OptionalCallExpression,
} from "@babel/types";
import type { PluginOptions } from "../types";
import { hasDollarSegmentInChain } from "./getRootObject";

const TRAVERSAL_BOUNDARY_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "JSXElement",
  "JSXFragment",
]);

function methodNames(opts: PluginOptions): Set<string> {
  return new Set(opts.methodNames?.length ? opts.methodNames : ["get"]);
}

export function sourceKeyForNode(node: Node): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "ThisExpression") return "this";
  if (node.type === "Super") return "super";
  if (node.type === "StringLiteral") return JSON.stringify(node.value);
  if (node.type === "NumericLiteral") return String(node.value);
  if (node.type === "BooleanLiteral") return String(node.value);
  if (node.type === "NullLiteral") return "null";
  if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
    const member = node as Node & {
      object: Node;
      property: Node;
      computed: boolean;
      optional?: boolean;
    };
    const object = sourceKeyForNode(member.object);
    const access = member.optional ? "?." : ".";
    if (member.computed) {
      return `${object}[${sourceKeyForNode(member.property)}]`;
    }
    return `${object}${access}${sourceKeyForNode(member.property)}`;
  }
  if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
    const call = node as CallExpression | OptionalCallExpression;
    return `${sourceKeyForNode(call.callee as Node)}()`;
  }
  if ("start" in node && "end" in node && node.start != null && node.end != null) {
    return `${node.type}:${node.start}:${node.end}`;
  }
  return node.type;
}

export function getCallSourceKey(node: Node, opts: PluginOptions): string | null {
  if (node.type === "CallExpression") {
    const { callee, arguments: args } = node;
    if (callee.type !== "MemberExpression") return null;
    if (callee.property.type !== "Identifier") return null;
    if (!methodNames(opts).has(callee.property.name)) return null;
    if (args.length !== 0) return null;
    if (!opts.allGet && !hasDollarSegmentInChain(callee.object)) return null;
    return sourceKeyForNode(callee.object);
  }

  if (node.type === "OptionalCallExpression") {
    const { callee, arguments: args } = node;
    if (callee.type !== "OptionalMemberExpression") return null;
    if (callee.property?.type !== "Identifier") return null;
    if (!methodNames(opts).has((callee.property as Identifier).name)) return null;
    if (args.length !== 0) return null;
    if (!opts.allGet && !hasDollarSegmentInChain(callee.object)) return null;
    return sourceKeyForNode(callee.object);
  }

  return null;
}

export function collectGetCallSources(exprPath: NodePath, opts: PluginOptions): Set<string> {
  const sources = new Set<string>();

  if (TRAVERSAL_BOUNDARY_TYPES.has(exprPath.node.type)) {
    return sources;
  }

  const rootSource = getCallSourceKey(exprPath.node, opts);
  if (rootSource !== null) {
    sources.add(rootSource);
  }

  exprPath.traverse({
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
      innerPath.skip();
    },
    JSXFragment(innerPath) {
      innerPath.skip();
    },

    OptionalCallExpression(innerPath) {
      const source = getCallSourceKey(innerPath.node, opts);
      if (source !== null) sources.add(source);
    },

    CallExpression(innerPath) {
      const source = getCallSourceKey(innerPath.node, opts);
      if (source !== null) sources.add(source);
    },
  });

  return sources;
}

export function sourcesEqual(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && isSourceSubset(a, b);
}

export function isSourceSubset(candidate: Set<string>, parent: Set<string> | null): boolean {
  if (parent === null) return false;
  for (const source of candidate) {
    if (!parent.has(source)) return false;
  }
  return candidate.size > 0;
}

export function unionSources(...sets: Array<Set<string> | null | undefined>): Set<string> {
  const result = new Set<string>();
  for (const set of sets) {
    if (!set) continue;
    for (const source of set) result.add(source);
  }
  return result;
}

export function expressionFromAutoElement(node: JSXElement): Expression | null {
  const child = node.children.find((c) => c.type === "JSXExpressionContainer");
  if (!child || child.type !== "JSXExpressionContainer") return null;
  const expression = child.expression;
  if (expression.type !== "ArrowFunctionExpression") return null;
  if (expression.body.type === "BlockStatement") return null;
  return expression.body as Expression;
}
