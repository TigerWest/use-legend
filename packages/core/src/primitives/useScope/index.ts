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
  const isMulti = rest.length >= 2;
  const hasProps = rest.length >= 1;
  const props = rest[0];

  const _registry = React.useContext(StoreRegistryContext);

  // ── refs (always called unconditionally) ──────────────────────────
  const ref = useRef<{
    scope: ReturnType<typeof effectScope>;
    result: unknown;
  } | null>(null);
  const scopeRef = useRef<{
    scope: ReturnType<typeof effectScope>;
    result: unknown;
    ctx: ScopePropsCtx<Record<string, unknown>>;
  } | null>(null);
  const multiRef = useRef<{
    scope: ReturnType<typeof effectScope>;
    result: unknown;
    ctxList: ScopePropsCtx<Record<string, unknown>>[];
  } | null>(null);

  // ── initialization (not hooks, safe to branch) ────────────────────
  if (isMulti) {
    const paramsList = rest as Record<string, unknown>[];

    // DEV assertion: rest args count must not change between renders
    if (process.env.NODE_ENV !== "production") {
      if (multiRef.current !== null && paramsList.length !== multiRef.current.ctxList.length) {
        console.error("[useScope] multi-params count changed between renders");
      }
    }

    if (multiRef.current === null) {
      const scope = effectScope();
      const ctxList: ScopePropsCtx<Record<string, unknown>>[] = paramsList.map((p) => ({
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
      multiRef.current = { scope, result, ctxList };
    }
    // Sync each param every render
    for (let i = 0; i < multiRef.current.ctxList.length; i++) {
      syncProps(multiRef.current.ctxList[i], paramsList[i]);
    }
  } else if (!hasProps) {
    if (ref.current === null) {
      const scope = effectScope();
      const _prev = setActiveValue(_registry);
      let result: unknown;
      try {
        result = scope.run(fn);
      } finally {
        setActiveValue(_prev);
      }
      ref.current = { scope, result };
    }
  } else {
    if (scopeRef.current === null) {
      const scope = effectScope();
      const propsCtx: ScopePropsCtx<Record<string, unknown>> = {
        propsRef: { current: props },
        props$: null,
        hints: null,
        rawPrev: null,
      };
      const reactiveProxy = createReactiveProxy(propsCtx);
      const _prev = setActiveValue(_registry);
      let result: unknown;
      try {
        result = scope.run(() => fn(reactiveProxy));
      } finally {
        setActiveValue(_prev);
      }
      scopeRef.current = { scope, result, ctx: propsCtx };
    }
    // Sync props every render (updates ref + observable diff if toObs was called)
    syncProps(scopeRef.current.ctx as ScopePropsCtx<Record<string, unknown>>, props);
  }

  useLayoutEffect(() => {
    if (isMulti) {
      if (!multiRef.current!.scope.active) {
        const prev = multiRef.current!;
        const scope = effectScope();
        const ctxList: ScopePropsCtx<Record<string, unknown>>[] = prev.ctxList.map((prevCtx) => ({
          propsRef: prevCtx.propsRef, // reuse — syncProps updates via this ref
          props$: null,
          hints: null,
          rawPrev: null,
        }));
        const proxies = ctxList.map((ctx) => createReactiveProxy(ctx));
        const _prev2 = setActiveValue(_registry);
        try {
          scope.run(() => fn(...proxies)); // re-register observers/lifecycle only, result discarded
        } finally {
          setActiveValue(_prev2);
        }
        multiRef.current = { scope, result: prev.result, ctxList }; // preserve prev.result
      }
      for (const cb of multiRef.current!.scope._beforeMountCbs) cb();
    } else if (!hasProps) {
      // Strict Mode: cleanup disposed scope between layoutEffect runs (no new render).
      // Re-create scope and re-run factory to restore observers/lifecycle.
      if (!ref.current!.scope.active) {
        const scope = effectScope();
        const _prev = setActiveValue(_registry);
        try {
          scope.run(fn);
        } finally {
          setActiveValue(_prev);
        }
        ref.current = { ...ref.current!, scope };
      }
      for (const cb of ref.current!.scope._beforeMountCbs) cb();
    } else {
      // Strict Mode: re-create scope if disposed between layoutEffect runs.
      // Reuse existing ctx + result so closures from the first factory run remain valid.
      if (!scopeRef.current!.scope.active) {
        const prev = scopeRef.current!;
        const scope = effectScope();
        const propsCtx: ScopePropsCtx<Record<string, unknown>> = {
          propsRef: prev.ctx.propsRef,
          props$: null,
          hints: null,
          rawPrev: null,
        };
        // Re-use the existing reactive proxy (already captured in factory closures)
        const existingProxy = createReactiveProxy(propsCtx);
        const _prev2 = setActiveValue(_registry);
        try {
          scope.run(() => fn(existingProxy));
        } finally {
          setActiveValue(_prev2);
        }
        scopeRef.current = { scope, result: prev.result, ctx: propsCtx };
      }
      for (const cb of scopeRef.current!.scope._beforeMountCbs) cb();
    }
  }, []);

  // eslint-disable-next-line use-legend/prefer-use-observe
  useEffect(() => {
    if (isMulti) {
      const { scope } = multiRef.current!;
      const cleanups: Array<() => void> = [];
      for (const cb of scope._mountCbs) {
        const cleanup = cb();
        if (typeof cleanup === "function") cleanups.push(cleanup);
      }
      return () => {
        for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
        scope.dispose();
      };
    } else if (!hasProps) {
      // Read scope from ref at effect time (may be fresh scope after Strict Mode remount)
      const { scope } = ref.current!;
      const cleanups: Array<() => void> = [];
      for (const cb of scope._mountCbs) {
        const cleanup = cb();
        if (typeof cleanup === "function") cleanups.push(cleanup);
      }
      return () => {
        for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
        scope.dispose();
      };
    } else {
      const { scope } = scopeRef.current!;
      const cleanups: Array<() => void> = [];
      for (const cb of scope._mountCbs) {
        const cleanup = cb();
        if (typeof cleanup === "function") cleanups.push(cleanup);
      }
      return () => {
        for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
        scope.dispose();
      };
    }
  }, []);

  if (isMulti) return multiRef.current!.result;
  return hasProps ? scopeRef.current!.result : ref.current!.result;
}
