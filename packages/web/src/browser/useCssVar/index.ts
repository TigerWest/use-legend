"use client";
import type { Observable } from "@legendapp/state";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { useRef } from "react";
import { get, peek, useMaybeObservable, useInitialPick, type MaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { useMutationObserver } from "@elements/useMutationObserver";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

export interface UseCssVarOptions extends ConfigurableWindow {
  initialValue?: string;
  /**
   * Use MutationObserver to monitor variable changes
   * @default false
   */
  observe?: boolean;
}

export function useCssVar(
  prop: MaybeObservable<string | null | undefined>,
  target?: MaybeEventTarget,
  options: UseCssVarOptions = {}
): Observable<string> {
  const opts$ = useMaybeObservable<UseCssVarOptions>(options, { window: "element" });
  const { initialValue, observe } = useInitialPick(opts$, {
    initialValue: "",
    observe: false,
  });
  const window$ = useResolvedWindow(opts$.window);

  const variable$ = useObservable<string>(initialValue);

  // Track previous prop + element for cleanup when they change
  const prevRef = useRef<{ prop: string | null | undefined; el: Element | null }>({
    prop: undefined,
    el: null,
  });

  const syncCssVar = (
    key: string | null | undefined,
    el: Element | null,
    win: Window | null | undefined
  ) => {
    if (el && win && key) {
      const value = win.getComputedStyle(el).getPropertyValue(key).trim();
      variable$.set(value || variable$.peek() || initialValue);
    }
  };

  // Watch prop + target: cleanup old property, read new value
  useObserveEffect(() => {
    const key = get(prop); // reactive dep on prop
    const win = window$.get() as Window | null;
    const docEl = win?.document?.documentElement ?? null;

    // Reactive dep on target (if Ref$ / Observable)
    const el: Element | null = target != null ? ((get(target) as Element | null) ?? docEl) : docEl;

    const prev = prevRef.current;
    if (prev.el && prev.prop && (prev.el !== el || prev.prop !== key)) {
      (prev.el as HTMLElement).style.removeProperty(prev.prop);
    }

    syncCssVar(key, el, win);
    prevRef.current = { prop: key, el };
  });

  // Watch variable$ + target: set/remove CSS property on element
  useObserveEffect(() => {
    const val = variable$.get(); // reactive dep
    const key = get(prop);
    const win = window$.get() as Window | null;
    const docEl = win?.document?.documentElement ?? null;
    const el: Element | null = target != null ? ((get(target) as Element | null) ?? docEl) : docEl;

    if (el && key) {
      if (val == null || val === "") {
        (el as HTMLElement).style.removeProperty(key);
      } else {
        (el as HTMLElement).style.setProperty(key, val);
      }
    }
  });

  // Optional MutationObserver to re-read when style/class attributes change
  // Always call the hook (Rules of Hooks), but pass null target when observe=false
  useMutationObserver(
    observe ? (target ?? null) : null,
    () => {
      const win = window$.peek() as Window | null;
      const docEl = win?.document?.documentElement ?? null;
      const el = (peek(target) as Element | null) ?? docEl;
      syncCssVar(peek(prop), el, win);
    },
    { attributeFilter: ["style", "class"] }
  );

  return variable$;
}
