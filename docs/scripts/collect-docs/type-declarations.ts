import * as ts from "typescript";
import * as path from "path";
import type { ChildTypeInfo, FunctionSignature, ParamInfo, PropertyInfo, ReturnInfo } from "./types";

export function extractFunctionSignature(
  sourceFilePath: string,
  exportName: string
): FunctionSignature | null {
  try {
    const configPath = ts.findConfigFile(
      path.dirname(sourceFilePath),
      ts.sys.fileExists,
      "tsconfig.json"
    );

    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      esModuleInterop: true,
      strict: true,
    };

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      compilerOptions = { ...parsed.options, skipLibCheck: true };
    }

    const program = ts.createProgram([sourceFilePath], compilerOptions);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(sourceFilePath);
    if (!sourceFile) return null;

    const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!sourceSymbol) return null;

    const exports = checker.getExportsOfModule(sourceSymbol);
    const targetSymbol = exports.find((s) => s.getName() === exportName);
    if (!targetSymbol) return null;

    // Resolve the type — handle `type X = typeof createY` aliases
    const declaration = targetSymbol.declarations?.[0];
    if (!declaration) return null;

    let callSignatures: readonly ts.Signature[];

    const declaredType = checker.getDeclaredTypeOfSymbol(targetSymbol);
    callSignatures = declaredType.getCallSignatures();

    if (callSignatures.length === 0) {
      const typeAtLocation = checker.getTypeOfSymbolAtLocation(targetSymbol, declaration);
      callSignatures = typeAtLocation.getCallSignatures();
    }

    if (callSignatures.length === 0) return null;

    // Use the last signature (most general for overloads)
    const sig = callSignatures[callSignatures.length - 1];

    // Extract JSDoc description — try target symbol first, then signature
    const description =
      ts.displayPartsToString(targetSymbol.getDocumentationComment(checker)) ||
      ts.displayPartsToString(sig.getDocumentation()) ||
      undefined;

    // Build JSDoc param descriptions from signature tags and target symbol tags
    const paramJsDocMap = new Map<string, string>();
    for (const tag of sig.getJsDocTags()) {
      if (tag.name === "param" && tag.text) {
        const text = ts.displayPartsToString(tag.text).trim();
        const match = text.match(/^(\w+\$?)\s*[-–—]?\s*(.*)$/s);
        if (match) {
          paramJsDocMap.set(match[1], match[2]);
        }
      }
    }
    // Also try the target symbol's own JSDoc tags (for type aliases with JSDoc)
    for (const tag of targetSymbol.getJsDocTags(checker)) {
      if (tag.name === "param" && tag.text) {
        const text = ts.displayPartsToString(tag.text).trim();
        const match = text.match(/^(\w+\$?)\s*[-–—]?\s*(.*)$/s);
        if (match && !paramJsDocMap.has(match[1])) {
          paramJsDocMap.set(match[1], match[2]);
        }
      }
    }

    // Get @returns from signature or target symbol
    const allJsDocTags = [...sig.getJsDocTags(), ...targetSymbol.getJsDocTags(checker)];
    const returnsTag = allJsDocTags.find(
      (tag) => tag.name === "returns" || tag.name === "return"
    );
    const returnsDescription = returnsTag
      ? ts.displayPartsToString(returnsTag.text).trim() || undefined
      : undefined;

    // Extract type parameters
    const typeParams = sig.typeParameters;
    let typeParameters: string | undefined;
    if (typeParams && typeParams.length > 0) {
      typeParameters = `<${typeParams.map((tp) => tp.symbol.getName()).join(", ")}>`;
    }

    // Extract parameters
    const params: ParamInfo[] = sig.parameters.map((paramSymbol) => {
      return extractParamInfo(paramSymbol, checker, declaration, paramJsDocMap);
    });

    // Extract return type
    const returns = extractReturnInfo(sig, checker, returnsDescription);

    return {
      name: exportName,
      description,
      typeParameters,
      params,
      returns,
    };
  } catch (e) {
    console.warn(`[type-table] Failed to extract signature for "${exportName}":`, e);
    return null;
  }
}

/**
 * Extract properties of a named exported type (interface/type alias).
 * Used for frontmatter `children` — explicitly referenced sub-types.
 */
export function extractNamedTypeProperties(
  sourceFilePath: string,
  typeName: string
): ChildTypeInfo | null {
  try {
    const configPath = ts.findConfigFile(
      path.dirname(sourceFilePath),
      ts.sys.fileExists,
      "tsconfig.json"
    );

    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      esModuleInterop: true,
      strict: true,
    };

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      compilerOptions = { ...parsed.options, skipLibCheck: true };
    }

    const program = ts.createProgram([sourceFilePath], compilerOptions);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(sourceFilePath);
    if (!sourceFile) return null;

    const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
    if (!sourceSymbol) return null;

    const exports = checker.getExportsOfModule(sourceSymbol);
    const sym = exports.find((s) => s.getName() === typeName);
    if (!sym) return null;

    const type = checker.getDeclaredTypeOfSymbol(sym);
    const properties = extractProperties(type, checker);
    if (!properties?.length) return null;

    return { name: typeName, properties };
  } catch (e) {
    console.warn(`[type-table] Failed to extract type "${typeName}":`, e);
    return null;
  }
}

/**
 * Remove import("..."). prefixes from type strings.
 * e.g. import("/path/to/module").Observable<T> → Observable<T>
 */
function cleanTypeString(typeStr: string): string {
  return typeStr.replace(/import\("[^"]*"\)\./g, "");
}

function extractParamInfo(
  paramSymbol: ts.Symbol,
  checker: ts.TypeChecker,
  context: ts.Node,
  jsDocMap?: Map<string, string>
): ParamInfo {
  const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, context);
  const paramDecl = paramSymbol.declarations?.[0] as ts.ParameterDeclaration | undefined;
  const optional = paramDecl ? checker.isOptionalParameter(paramDecl) : false;

  // Get the display type string
  let displayType = cleanTypeString(
    checker.typeToString(paramType, context, ts.TypeFormatFlags.NoTruncation)
  );

  // Check for DeepMaybeObservable wrapper — unwrap via string match + type resolution
  let properties: PropertyInfo[] | undefined;
  const dmoMatch = displayType.match(/^(?:DeepMaybeObservable<(.+)>(?:\s*\|\s*undefined)?)$/);

  if (dmoMatch) {
    const innerTypeName = dmoMatch[1]; // e.g. "AutoResetOptions"
    displayType = innerTypeName;

    // Try to resolve the inner type for property extraction
    const unwrapped = unwrapDeepMaybeObservable(paramType, checker);
    if (unwrapped) {
      properties = extractProperties(unwrapped, checker);
    } else {
      // Fallback: find the type by name from the program's exports
      const innerType = resolveTypeByName(innerTypeName, checker, context);
      if (innerType) {
        properties = extractProperties(innerType, checker);
      }
    }
  }

  // JSDoc @param — try symbol docs first, then fall back to jsDocMap
  const description =
    ts.displayPartsToString(paramSymbol.getDocumentationComment(checker)) ||
    jsDocMap?.get(paramSymbol.getName()) ||
    undefined;

  return { name: paramSymbol.getName(), type: displayType, description, optional, properties };
}

function unwrapDeepMaybeObservable(type: ts.Type, checker: ts.TypeChecker): ts.Type | null {
  // Direct match
  const symbol = type.getSymbol() ?? type.aliasSymbol;
  if (symbol?.getName() === "DeepMaybeObservable") {
    const typeArgs = type.aliasTypeArguments ?? (type as any).typeArguments;
    return typeArgs?.[0] ?? null;
  }
  // Handle union types: DeepMaybeObservable<T> | undefined (from optional params)
  if (type.isUnion()) {
    for (const member of type.types) {
      if (member.flags & ts.TypeFlags.Undefined) continue;
      const result = unwrapDeepMaybeObservable(member, checker);
      if (result) return result;
    }
  }
  return null;
}

function resolveTypeByName(
  typeName: string,
  checker: ts.TypeChecker,
  context: ts.Node
): ts.Type | null {
  const sourceFile = context.getSourceFile();
  const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!sourceSymbol) return null;

  const exports = checker.getExportsOfModule(sourceSymbol);
  const sym = exports.find((s) => s.getName() === typeName);
  if (!sym) return null;

  const decl = sym.declarations?.[0];
  if (!decl) return null;

  return checker.getDeclaredTypeOfSymbol(sym);
}

function extractProperties(type: ts.Type, checker: ts.TypeChecker): PropertyInfo[] | undefined {
  const props = checker.getPropertiesOfType(type);
  if (props.length === 0) return undefined;

  return props.map((prop) => {
    const propType = checker.getTypeOfSymbol(prop);
    const optional = !!(prop.flags & ts.SymbolFlags.Optional);

    const description =
      ts.displayPartsToString(prop.getDocumentationComment(checker)) || undefined;

    // Extract @default from JSDoc tags
    const jsDocTags = prop.getJsDocTags(checker);
    const defaultTag = jsDocTags.find((tag) => tag.name === "default");
    const defaultValue = defaultTag
      ? ts.displayPartsToString(defaultTag.text).trim() || undefined
      : undefined;

    let typeStr = cleanTypeString(checker.typeToString(propType));
    // Strip " | undefined" from optional properties — already indicated by optional flag
    if (optional) {
      typeStr = typeStr.replace(/\s*\|\s*undefined$/, "");
    }

    return {
      name: prop.getName(),
      type: typeStr,
      description,
      optional,
      defaultValue,
    };
  });
}

function extractReturnInfo(
  sig: ts.Signature,
  checker: ts.TypeChecker,
  descriptionOverride?: string
): ReturnInfo {
  const returnType = checker.getReturnTypeOfSignature(sig);
  const cleanTypeStr = cleanTypeString(
    checker.typeToString(returnType, undefined, ts.TypeFormatFlags.NoTruncation)
  );

  const description = descriptionOverride || undefined;

  // Check if return type is an object/interface with properties worth expanding
  let properties: PropertyInfo[] | undefined;

  // Skip expansion for known generic wrappers
  const SKIP_EXPAND = [
    "Observable",
    "ReadonlyObservable",
    "Promise",
    "Array",
    "Map",
    "Set",
  ];
  const isGenericWrapper = SKIP_EXPAND.some(
    (name) => cleanTypeStr.startsWith(name + "<") || cleanTypeStr === name
  );

  if (!isGenericWrapper) {
    const returnProps = checker.getPropertiesOfType(returnType);
    if (returnProps.length > 0 && returnProps.length <= 20) {
      const hasCallSignatures = returnType.getCallSignatures().length > 0;
      if (!hasCallSignatures) {
        properties = extractProperties(returnType, checker);
      }
    }
  }

  return { type: cleanTypeStr, description, properties };
}
