"use client";
import React, { useEffect, useLayoutEffect, useRef } from "react";
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
export { toObs } from "./reactiveProps";
export type { ReactiveProps } from "./reactiveProps";

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
export function useScope<T extends object>(fn: () => T): T;
export function useScope<P extends Record<string, unknown>, T extends object>(
  fn: (props: ReactiveProps<P>) => T,
  props: P
): T;
export function useScope<
  Params extends [Record<string, unknown>, Record<string, unknown>, ...Record<string, unknown>[]],
  T extends object,
>(
  fn: (...params: { [K in keyof Params]: ReactiveProps<Params[K] & Record<string, unknown>> }) => T,
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

  if (stateRef.current === null) {
    const scope = effectScope();
    const ctxList: ScopePropsCtx<Record<string, unknown>>[] = rest.map((p) => ({
      propsRef: { current: p },
      props$: null,
      hints: null,
      rawPrev: null,
    }));
    const proxies = ctxList.map((ctx) => createReactiveProxy(ctx));
    const _prev = setActiveValue(_registry);
    let result: unknown;
    try {
      result = scope.run(() => fn(...proxies));
    } finally {
      setActiveValue(_prev);
    }
    stateRef.current = { scope, result, ctxList };
  }

  for (let i = 0; i < stateRef.current.ctxList.length; i++) {
    syncProps(stateRef.current.ctxList[i], rest[i]);
  }

  // ── Strict Mode: re-create disposed scope ─────────────────────────
  useLayoutEffect(() => {
    if (!stateRef.current!.scope.active) {
      const prev = stateRef.current!;
      const scope = effectScope();
      const ctxList: ScopePropsCtx<Record<string, unknown>>[] = prev.ctxList.map((prevCtx) => ({
        propsRef: prevCtx.propsRef, // reuse — syncProps keeps this current
        props$: null,
        hints: null,
        rawPrev: null,
      }));
      const proxies = ctxList.map((ctx) => createReactiveProxy(ctx));
      const _prev = setActiveValue(_registry);
      try {
        scope.run(() => fn(...proxies)); // re-register observers/lifecycle; result discarded
      } finally {
        setActiveValue(_prev);
      }
      stateRef.current = { scope, result: prev.result, ctxList };
    }
    for (const cb of stateRef.current!.scope._beforeMountCbs) cb();
  }, []);

  // ── mount / unmount ───────────────────────────────────────────────
  // eslint-disable-next-line use-legend/prefer-use-observe
  useEffect(() => {
    const { scope } = stateRef.current!;
    const cleanups: Array<() => void> = [];
    for (const cb of scope._mountCbs) {
      const cleanup = cb();
      if (typeof cleanup === "function") cleanups.push(cleanup);
    }
    return () => {
      for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
      scope.dispose();
    };
  }, []);

  return stateRef.current!.result;
}
