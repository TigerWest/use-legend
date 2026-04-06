"use client";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { effectScope } from "./effectScope";
import { StoreRegistryContext, setActiveValue } from "../../state/defineStore/storeContext";
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useScope(fn: any, props?: any): any {
  const hasProps = props !== undefined;

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

  // ── initialization (not hooks, safe to branch) ────────────────────
  if (!hasProps) {
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
    if (!hasProps) {
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
    if (!hasProps) {
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

  return hasProps ? scopeRef.current!.result : ref.current!.result;
}
