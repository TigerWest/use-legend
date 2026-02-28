import type { NodePath } from '@babel/core';
import type { PluginOptions } from '../types';
import { getRootObject } from './getRootObject';

function isGetCallNode(node: any, opts: PluginOptions): boolean {
  if (node.type === 'CallExpression') {
    const { callee, arguments: args } = node;
    if (callee.type !== 'MemberExpression') return false;
    if (callee.property.type !== 'Identifier') return false;
    if (callee.property.name !== 'get') return false;
    if (args.length !== 0) return false;
    if (!opts.allGet) {
      const root = getRootObject(callee.object);
      if (!root || !root.name?.endsWith('$')) return false;
    }
    return true;
  }
  if (node.type === 'OptionalCallExpression') {
    const { callee, arguments: args } = node;
    if (callee.type !== 'OptionalMemberExpression') return false;
    if (callee.property?.type !== 'Identifier') return false;
    if (callee.property?.name !== 'get') return false;
    if (args.length !== 0) return false;
    if (!opts.allGet) {
      const root = getRootObject(callee.object);
      if (!root || !root.name?.endsWith('$')) return false;
    }
    return true;
  }
  return false;
}

/**
 * Checks if a NodePath contains a zero-argument .get() call on a $-suffixed observable.
 *
 * IMPORTANT: path.traverse() visits CHILDREN, not the root node itself.
 * We must check the root node separately.
 *
 * - Stops traversal at function boundaries (ArrowFunctionExpression, FunctionExpression, FunctionDeclaration)
 * - Supports OptionalCallExpression: obs$?.get()
 * - Ignores .get(key) calls with arguments (Map.get(key))
 * - When opts.allGet is false (default), root object must end with '$'
 */
const FUNCTION_BOUNDARY_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression',
  'FunctionDeclaration',
]);

export function hasGetCall(exprPath: NodePath, opts: PluginOptions): boolean {
  // If the root node itself is a function boundary, do not descend into it.
  // path.traverse() visits CHILDREN only, so the ArrowFunctionExpression visitor
  // inside traverse() would NOT fire for the root — leading to false positives.
  if (FUNCTION_BOUNDARY_TYPES.has(exprPath.node.type)) {
    return false;
  }

  // Check the root node itself first (traverse does NOT visit it)
  if (isGetCallNode(exprPath.node, opts)) {
    return true;
  }

  let found = false;

  exprPath.traverse({
    // Stop at function boundaries — don't wrap event handlers or hook callbacks
    ArrowFunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionExpression(innerPath) {
      innerPath.skip();
    },
    FunctionDeclaration(innerPath) {
      innerPath.skip();
    },

    OptionalCallExpression(innerPath) {
      if (isGetCallNode(innerPath.node, opts)) {
        found = true;
        innerPath.stop();
      }
    },

    CallExpression(innerPath) {
      if (isGetCallNode(innerPath.node, opts)) {
        found = true;
        innerPath.stop();
      }
    },
  });

  return found;
}
