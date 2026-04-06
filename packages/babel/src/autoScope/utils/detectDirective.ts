import type { BlockStatement } from "@babel/types";

export function hasScopeDirective(block: BlockStatement): boolean {
  return block.directives?.some((d) => d.value.value === "use scope") ?? false;
}
