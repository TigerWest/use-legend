import type { TSESLint } from "@typescript-eslint/utils";
import { observableNaming } from "./observable-naming";
import { noObservableInJsx } from "./no-observable-in-jsx";
import { hookReturnNaming } from "./hook-return-naming";
import { noEnableApi } from "./no-enable-api";
import { noReactiveHoc } from "./no-reactive-hoc";
import { preferShowForConditional } from "./prefer-show-for-conditional";
import { preferForComponent } from "./prefer-for-component";
import { preferUseObservable } from "./prefer-use-observable";
import { preferUseObserve } from "./prefer-use-observe";

export const rules: Record<string, TSESLint.RuleModule<string, unknown[]>> = {
  "observable-naming": observableNaming,
  "no-observable-in-jsx": noObservableInJsx,
  "hook-return-naming": hookReturnNaming,
  "no-enable-api": noEnableApi,
  "no-reactive-hoc": noReactiveHoc,
  "prefer-show-for-conditional": preferShowForConditional,
  "prefer-for-component": preferForComponent,
  "prefer-use-observable": preferUseObservable,
  "prefer-use-observe": preferUseObserve,
};
