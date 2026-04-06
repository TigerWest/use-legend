import type { Statement, ReturnStatement } from "@babel/types";
import type { types as BabelTypes } from "@babel/core";

export interface SplitBody {
  declarations: Statement[]; // everything before final return
  finalReturn: ReturnStatement | undefined;
}

export function splitBody(stmtsWithoutDirective: Statement[], t: typeof BabelTypes): SplitBody {
  if (stmtsWithoutDirective.length === 0) {
    return { declarations: [], finalReturn: undefined };
  }
  const last = stmtsWithoutDirective[stmtsWithoutDirective.length - 1];
  if (t.isReturnStatement(last)) {
    return {
      declarations: stmtsWithoutDirective.slice(0, -1),
      finalReturn: last,
    };
  }
  return { declarations: stmtsWithoutDirective, finalReturn: undefined };
}
