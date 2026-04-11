import { type Observable, observable } from "@legendapp/state";
import {
  get,
  observe,
  onUnmount,
  peek,
  type DeepMaybeObservable,
  type MaybeObservable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createMutationObserver } from "../../elements/useMutationObserver/core";

export interface UseCssVarOptions extends ConfigurableWindow {
  initialValue?: string;
  /**
   * Use MutationObserver to monitor variable changes
   * @default false
   */
  observe?: boolean;
}

export type UseCssVarReturn = Observable<string>;

/**
 * Framework-agnostic reactive CSS custom property (CSS variable) tracker.
 *
 * Creates an `Observable<string>` that reflects (and writes back to) a CSS
 * custom property on a DOM element. Reactive inputs (`prop`, `target`, and
 * options) propagate through `observe()` — the old property is cleaned off
 * the previous element before the new one is written.
 *
 * Must be called inside a `useScope` factory.
 */
export function createCssVar(
  prop: MaybeObservable<string | null | undefined>,
  target?: MaybeEventTarget,
  options?: DeepMaybeObservable<UseCssVarOptions>
): UseCssVarReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const initialValue = opts$.peek()?.initialValue ?? "";
  const observeFlag = opts$.peek()?.observe ?? false;

  const variable$ = observable<string>(initialValue);

  // Track previous (prop, element) pair so we can remove the old CSS custom
  // property when either input changes — same semantics as the legacy hook.
  let prevProp: string | null | undefined = undefined;
  let prevEl: Element | null = null;

  const syncFromElement = (
    key: string | null | undefined,
    el: Element | null,
    win: Window | null | undefined
  ) => {
    if (el && win && key) {
      const value = win.getComputedStyle(el).getPropertyValue(key).trim();
      variable$.set(value || variable$.peek() || initialValue);
    }
  };

  // Watch prop + target + window: clean up old property and read new value.
  observe(() => {
    const key = get(prop);
    const win = win$.get() as Window | null;
    const docEl = win?.document?.documentElement ?? null;
    const resolved = target != null ? ((get(target) as Element | null) ?? docEl) : docEl;
    const el: Element | null = resolved;

    if (prevEl && prevProp && (prevEl !== el || prevProp !== key)) {
      (prevEl as HTMLElement).style.removeProperty(prevProp);
    }

    syncFromElement(key, el, win);
    prevProp = key;
    prevEl = el;
  });

  // Watch variable$ + target + prop: set/remove CSS property on element.
  observe(() => {
    const val = variable$.get();
    const key = get(prop);
    const win = win$.get() as Window | null;
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

  // Optional MutationObserver — re-read when `style` / `class` attributes
  // change. Construction-time flag — matches legacy `useInitialPick` behavior.
  if (observeFlag) {
    createMutationObserver(
      (target ?? null) as MaybeEventTarget,
      () => {
        const win = win$.peek() as Window | null;
        const docEl = win?.document?.documentElement ?? null;
        const el = (target != null ? ((peek(target) as Element | null) ?? docEl) : docEl) ?? null;
        syncFromElement(peek(prop), el, win);
      },
      { attributeFilter: ["style", "class"] }
    );
  }

  onUnmount(() => {
    prevEl = null;
    prevProp = undefined;
  });

  return variable$;
}
