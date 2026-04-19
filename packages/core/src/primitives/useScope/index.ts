"use client";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import type { ImmutableObservableBase } from "@legendapp/state";
import { effectScope } from "./effectScope";
import { StoreRegistryContext, setActiveValue } from "@primitives/createStore/storeContext";
import {
  createReactiveProxy,
  syncProps,
  type ScopePropsCtx,
  type ReactiveProps,
} from "./reactiveProps";

export { onBeforeMount, onMount, onUnmount } from "./effectScope";
export { observe } from "./observe";
export { toObs } from "./toObs";
export type { PropsOf } from "./toObs";
export type { ReactiveProps } from "./reactiveProps";
export { inject } from "./inject";

/**
 * Runs a factory function exactly once per mount inside an effect scope.
 * The factory's return value is stable across re-renders.
 *
 * In React Strict Mode (development), the factory may run twice — once per
 * mount cycle — as React simulates unmount/remount to detect side-effect bugs.
 * This is expected and safe; production behavior is always run-once.
 *
 * **Overload 1 — no props:**
 * ```tsx
 * const { count$ } = useScope(() => {
 *   const count$ = observable(0)
 *   onMount(() => console.log('mounted'))
 *   return { count$ }
 * })
 * ```
 *
 * **Overload 2 — with props:**
 * ```tsx
 * const result = useScope((p) => {
 *   // p.count — raw latest (no tracking)
 *   // toObs(p).count.get() — reactive
 *   const obs$ = toObs(p)
 *   observe(() => console.log(obs$.count.get()))
 *   return {}
 * }, props)
 * ```
 */
/**
 * Extract base type P from DeepMaybeObservable<P> unions.
 * Uses Extract to find Observable members → infer P, avoiding circular reference
 * that occurs with direct DeepMaybeObservable<P> pattern matching.
 * @internal
 */

type InferBaseFromDeep<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Extract<T, ImmutableObservableBase<any>> extends never
    ? T
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Extract<T, ImmutableObservableBase<any>> extends ImmutableObservableBase<infer U>
      ? U
      : T;

export function useScope<T extends object>(fn: () => T): T;
export function useScope<P extends object, T extends object>(
  fn: (props: ReactiveProps<P>) => T,
  props: ImmutableObservableBase<P>
): T;
export function useScope<Props extends object, T extends object>(
  fn: (props: ReactiveProps<InferBaseFromDeep<Props> & object>) => T,
  props: Props
): T;
export function useScope<Params extends [object, object, ...object[]], T extends object>(
  fn: (
    ...params: { [K in keyof Params]: ReactiveProps<InferBaseFromDeep<Params[K]> & object> }
  ) => T,
  ...params: Params
): T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useScope(fn: any, ...rest: any[]): any {
  const _registry = React.useContext(StoreRegistryContext);

  const stateRef = useRef<{
    scope: ReturnType<typeof effectScope>;
    result: unknown;
    ctxList: ScopePropsCtx<Record<string, unknown>>[];
  } | null>(null);

  if (process.env.NODE_ENV !== "production") {
    if (stateRef.current !== null && rest.length !== stateRef.current.ctxList.length) {
      console.error("[useScope] params count changed between renders");
    }
  }

  const justCreated = stateRef.current === null;

  if (justCreated) {
    const scope = effectScope();
    const ctxList: ScopePropsCtx<Record<string, unknown>>[] = rest.map((p) => ({
      propsRef: { current: p },
      props$: null,
      hints: null,
      rawPrev: null,
    }));
    const proxies = ctxList.map((ctx) => createReactiveProxy(ctx));

    const _prev = setActiveValue(_registry);
    scope._injectRecording = true;

    let result: unknown;
    try {
      result = scope.run(() => fn(...proxies)); // factory runs exactly once, ever
    } finally {
      scope._injectRecording = false;
      setActiveValue(_prev);
    }
    stateRef.current = { scope, result, ctxList };
  }

  // Replay useContext calls on every render EXCEPT the one that just created
  // stateRef (on that render they already ran inside scope.run via inject()).
  if (!justCreated) {
    const recorded = stateRef.current!.scope._recordedCtxs;
    for (let i = 0; i < recorded.length; i++) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useContext(recorded[i] as React.Context<unknown>);
    }
  }

  for (let i = 0; i < stateRef.current!.ctxList.length; i++) {
    syncProps(stateRef.current!.ctxList[i], rest[i]);
  }

  // onBeforeMount — fires on every useLayoutEffect mount (twice in Strict Mode,
  // matching React's useLayoutEffect double-invoke).
  useLayoutEffect(() => {
    for (const cb of stateRef.current!.scope._beforeMountCbs) cb();
  }, []);

  // mount / unmount — observers pause on cleanup (sync unsub), resume on next mount.
  // factory is NEVER re-run, even in Strict Mode.
  // eslint-disable-next-line use-legend/prefer-use-observe
  useEffect(() => {
    const { scope } = stateRef.current!;
    scope._resumeAll(); // no-op on first mount; restores observers after Strict Mode remount
    const cleanups: Array<() => void> = [];
    for (const cb of scope._mountCbs) {
      const cleanup = cb();
      if (typeof cleanup === "function") cleanups.push(cleanup);
    }
    return () => {
      for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
      scope._pauseAll(); // sync unsubscribe; records preserved for next resume
    };
  }, []);

  return stateRef.current!.result;
}
