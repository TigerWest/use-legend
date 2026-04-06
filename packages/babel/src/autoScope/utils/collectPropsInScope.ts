import type { NodePath, types as BabelTypes } from "@babel/core";
import type { Function as BabelFunction, Statement, ObjectPattern, Node } from "@babel/types";

export interface CollectedPropEntry {
  key?: string;
  local: string;
  rest?: boolean;
  identifier?: boolean;
}

export interface CollectedProps {
  used: boolean;
  entries: CollectedPropEntry[];
  kind: "none" | "identifier" | "object";
  factoryParam: string;
}

function collectNestedNames(node: Node, t: typeof BabelTypes, names: Set<string>): void {
  if (t.isIdentifier(node)) {
    names.add(node.name);
  } else if (t.isObjectPattern(node)) {
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) collectNestedNames(prop.value, t, names);
      else if (t.isRestElement(prop)) collectNestedNames(prop.argument, t, names);
    }
  } else if (t.isArrayPattern(node)) {
    for (const el of node.elements) {
      if (el) collectNestedNames(el, t, names);
    }
  } else if (t.isAssignmentPattern(node)) {
    collectNestedNames(node.left, t, names);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isParamBinding(binding: any, fnPath: NodePath<BabelFunction>): boolean {
  if (binding.kind !== "param") return false;
  return binding.scope === fnPath.scope;
}

function getFactoryParamName(fnPath: NodePath<BabelFunction>): string {
  const scope = fnPath.scope;
  if (!scope.hasBinding("p") && !scope.hasReference("p")) {
    return "p";
  }
  return scope.generateUid("p");
}

export function collectPropsInScope(
  fnPath: NodePath<BabelFunction>,
  declarations: Statement[],
  t: typeof BabelTypes
): CollectedProps {
  const params = fnPath.node.params;

  // Step 1: No params → nothing to collect
  if (params.length === 0) {
    return { used: false, entries: [], kind: "none", factoryParam: "" };
  }

  const param = params[0];
  const entries: CollectedPropEntry[] = [];
  let kind: "none" | "identifier" | "object" = "none";

  // Build nestedBindingNames before traverse
  const nestedBindingNames = new Set<string>();

  // Step 2: Build entries from params[0]
  if (t.isObjectPattern(param)) {
    kind = "object";

    // Collect nested destructuring names for error reporting
    for (const prop of (param as ObjectPattern).properties) {
      if (t.isObjectProperty(prop)) {
        const val = prop.value;
        if (t.isObjectPattern(val) || t.isArrayPattern(val)) {
          collectNestedNames(val, t, nestedBindingNames);
        }
      }
    }

    for (const prop of (param as ObjectPattern).properties) {
      if (t.isRestElement(prop)) {
        if (t.isIdentifier(prop.argument)) {
          entries.push({ local: prop.argument.name, rest: true });
        }
      } else if (t.isObjectProperty(prop)) {
        const key = t.isIdentifier(prop.key) ? prop.key.name : undefined;
        const val = prop.value;

        if (t.isIdentifier(val)) {
          if (key !== undefined) {
            entries.push({ key, local: val.name });
          }
        } else if (t.isAssignmentPattern(val) && t.isIdentifier(val.left)) {
          if (key !== undefined) {
            entries.push({ key, local: val.left.name });
          }
        }
        // Nested ObjectPattern/ArrayPattern: names collected in nestedBindingNames above, not added to entries
      }
    }
  } else if (t.isIdentifier(param)) {
    kind = "identifier";
    entries.push({ local: param.name, identifier: true });
  }
  // ArrayPattern: kind stays 'none', entries stays empty

  // Step 3: Build lookup maps
  const nonRestEntryByLocal = new Map<string, CollectedPropEntry>();
  const restLocalNames = new Set<string>();
  let identifierLocal: string | null = null;

  for (const entry of entries) {
    if (entry.rest) {
      restLocalNames.add(entry.local);
    } else if (entry.identifier) {
      identifierLocal = entry.local;
    } else {
      nonRestEntryByLocal.set(entry.local, entry);
    }
  }

  // Step 5: Traverse declarations
  let used = false;
  let factoryParam = "";

  const bodyPath = fnPath.get("body") as NodePath<import("@babel/types").BlockStatement>;
  const stmtPaths = bodyPath.get("body") as NodePath<Statement>[];

  const declarationSet = new Set(declarations);
  const declarationPaths = stmtPaths.filter((p) => declarationSet.has(p.node));

  for (const declPath of declarationPaths) {
    declPath.traverse({
      Identifier(idPath) {
        const parent = idPath.parentPath;

        // Guard (a): skip non-computed MemberExpression.property
        if (
          parent &&
          parent.isMemberExpression() &&
          parent.node.property === idPath.node &&
          !parent.node.computed
        )
          return;

        // Guard (b): skip non-computed ObjectProperty/ObjectMethod key
        if (
          parent &&
          (parent.isObjectProperty() || parent.isObjectMethod()) &&
          (parent.node as BabelTypes.ObjectProperty | BabelTypes.ObjectMethod).key ===
            idPath.node &&
          !(parent.node as BabelTypes.ObjectProperty | BabelTypes.ObjectMethod).computed
        )
          return;

        // Guard (c): skip type annotations and labels
        if (
          parent &&
          (parent.isTSTypeAnnotation() ||
            parent.isTSTypeReference() ||
            (parent.isLabeledStatement() &&
              (parent.node as BabelTypes.LabeledStatement).label === idPath.node))
        )
          return;

        // Guard (d): scope binding resolution
        const name = idPath.node.name;
        const binding = idPath.scope.getBinding(name);
        if (!binding) return;
        if (!isParamBinding(binding, fnPath)) return;

        // Guard (e): rest-binding referenced → error
        if (restLocalNames.has(name)) {
          throw idPath.buildCodeFrameError(
            `"use scope" V2: rest-spread prop "${name}" cannot be referenced in scope body. ` +
              `Use the identifier param form (props) => props.${name} instead, or destructure ` +
              `the specific keys you need.`
          );
        }

        // Guard (f): nested destructuring referenced → error
        if (nestedBindingNames.has(name)) {
          throw idPath.buildCodeFrameError(
            `"use scope" V2: nested destructured prop "${name}" is not supported. ` +
              `Use flat destructuring or the identifier param form.`
          );
        }

        // Lazy-initialize factory param on first rewrite
        if (!factoryParam) {
          factoryParam = getFactoryParamName(fnPath);
        }

        // Guard (g): rewrite
        const entry = nonRestEntryByLocal.get(name);
        if (entry) {
          // Destructured prop: count → p.count
          idPath.replaceWith(
            t.memberExpression(t.identifier(factoryParam), t.identifier(entry.key!))
          );
        } else if (name === identifierLocal) {
          // Identifier param: props → p
          idPath.replaceWith(t.identifier(factoryParam));
        } else {
          return; // not a tracked prop binding
        }

        used = true;
      },
    });
  }

  return { used, entries, kind, factoryParam };
}
