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

function getFactoryParamNameForIndex(fnPath: NodePath<BabelFunction>, index: number): string {
  const scope = fnPath.scope;
  const candidate = `p${index}`;
  if (!scope.hasBinding(candidate) && !scope.hasReference(candidate)) {
    return candidate;
  }
  return scope.generateUid(`p${index}`);
}

interface ParamInfo {
  entries: CollectedPropEntry[];
  kind: "none" | "identifier" | "object";
  factoryParam: string;
  used: boolean;
  nestedBindingNames: Set<string>;
  nonRestEntryByLocal: Map<string, CollectedPropEntry>;
  restLocalNames: Set<string>;
  identifierLocal: string | null;
}

export function collectPropsInScope(
  fnPath: NodePath<BabelFunction>,
  declarations: Statement[],
  t: typeof BabelTypes
): CollectedProps[] {
  const params = fnPath.node.params;

  // No params → nothing to collect
  if (params.length === 0) {
    return [];
  }

  const isSingleParam = params.length === 1;

  // Build per-param info structures
  const paramInfos: ParamInfo[] = params.map((param, i) => {
    const entries: CollectedPropEntry[] = [];
    let kind: "none" | "identifier" | "object" = "none";
    const nestedBindingNames = new Set<string>();

    if (t.isObjectPattern(param)) {
      kind = "object";

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
        }
      }
    } else if (t.isIdentifier(param)) {
      kind = "identifier";
      entries.push({ local: param.name, identifier: true });
    }
    // ArrayPattern: kind stays 'none', entries stays empty

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

    // Determine factory param name
    let factoryParam = "";
    if (isSingleParam) {
      // Single param: use original logic (lazy, set on first use)
      factoryParam = ""; // will be assigned lazily in traverse
    } else {
      // Multi-param: pre-assign based on index (will be used if param is used)
      factoryParam = getFactoryParamNameForIndex(fnPath, i);
    }

    return {
      entries,
      kind,
      factoryParam,
      used: false,
      nestedBindingNames,
      nonRestEntryByLocal,
      restLocalNames,
      identifierLocal,
    };
  });

  // Build localName → paramIndex map
  const localToParamIndex = new Map<string, number>();
  for (let i = 0; i < params.length; i++) {
    const info = paramInfos[i];
    for (const entry of info.entries) {
      localToParamIndex.set(entry.local, i);
    }
  }

  // Traverse declarations
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

        // Resolve which param owns this name
        let info: ParamInfo;
        if (isSingleParam) {
          info = paramInfos[0];
        } else {
          const paramIndex = localToParamIndex.get(name);
          if (paramIndex === undefined) return;
          info = paramInfos[paramIndex];
        }

        // Guard (e): rest-binding referenced → error
        if (info.restLocalNames.has(name)) {
          throw idPath.buildCodeFrameError(
            `"use scope" V2: rest-spread prop "${name}" cannot be referenced in scope body. ` +
              `Use the identifier param form (props) => props.${name} instead, or destructure ` +
              `the specific keys you need.`
          );
        }

        // Guard (f): nested destructuring referenced → error
        if (info.nestedBindingNames.has(name)) {
          throw idPath.buildCodeFrameError(
            `"use scope" V2: nested destructured prop "${name}" is not supported. ` +
              `Use flat destructuring or the identifier param form.`
          );
        }

        // Lazy-initialize factory param on first rewrite (single-param starts as "")
        if (!info.factoryParam) {
          info.factoryParam = getFactoryParamName(fnPath);
        }

        const entry = info.nonRestEntryByLocal.get(name);
        if (entry) {
          idPath.replaceWith(
            t.memberExpression(t.identifier(info.factoryParam), t.identifier(entry.key!))
          );
        } else if (name === info.identifierLocal) {
          idPath.replaceWith(t.identifier(info.factoryParam));
        } else {
          return;
        }

        info.used = true;
      },
    });
  }

  return paramInfos.map((info) => ({
    used: info.used,
    entries: info.entries,
    kind: info.kind,
    factoryParam: info.factoryParam,
  }));
}
