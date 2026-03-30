"use client";
import type { ReadonlyObservable } from "@usels/core";
import { observable, type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useEventListener } from "@browser/useEventListener";
import { useConstant } from "@usels/core/shared/useConstant";
import { useLatest } from "@usels/core/shared/useLatest";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useMaybeObservable } from "@usels/core";

export interface UseMagicKeysOptions extends ConfigurableWindow {
  /** Custom alias map for key names */
  aliasMap?: Record<string, string>;
  /** Event handler called on every keydown/keyup. Return false to skip tracking. */
  onEventFired?: (e: KeyboardEvent) => boolean | void;
  /** Options passed to the underlying addEventListener calls. @default { passive: true } */
  eventListenerOptions?: AddEventListenerOptions;
}

const DEFAULT_ALIAS_MAP: Record<string, string> = {
  ctrl: "control",
  cmd: "meta",
  command: "meta",
  option: "alt",
  esc: "escape",
  del: "delete",
  space: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

export type UseMagicKeysReturn = {
  /** Set of currently pressed key names (lowercase) */
  current$: ReadonlyObservable<Set<string>>;
} & {
  /** Access any key as a reactive boolean. e.g., keys["a"], keys["shift"], keys["ctrl+a"] */
  [key: string]: ReadonlyObservable<boolean>;
};

/*@__NO_SIDE_EFFECTS__*/
export function useMagicKeys(options: UseMagicKeysOptions = {}): UseMagicKeysReturn {
  const { aliasMap = {}, onEventFired, eventListenerOptions = { passive: true } } = options;

  const mergedAliases = useConstant(() => ({ ...DEFAULT_ALIAS_MAP, ...aliasMap }));
  const keyMap = useConstant<Map<string, Observable<boolean>>>(() => new Map());
  const comboKeys = useConstant<Set<string>>(() => new Set());
  const pressedKeys = useConstant<Set<string>>(() => new Set());
  const current$ = useObservable<Set<string>>(new Set());

  const onEventFiredRef = useLatest(onEventFired);

  const windowOpts$ = useMaybeObservable<ConfigurableWindow>(
    { window: options.window },
    { window: "element" }
  );
  const window$ = useResolvedWindow(windowOpts$.window);

  const resolveKey = useConstant(() => (key: string): string => {
    const lower = key.toLowerCase();
    return mergedAliases[lower] ?? lower;
  });

  const getOrCreateKey = useConstant(() => (key: string): Observable<boolean> => {
    const resolved = resolveKey(key);
    let obs = keyMap.get(resolved);
    if (!obs) {
      obs = observable(false);
      keyMap.set(resolved, obs);
    }
    return obs;
  });

  const isComboPressed = useConstant(() => (combo: string): boolean => {
    return combo
      .split("+")
      .map((p) => resolveKey(p.trim()))
      .every((k) => pressedKeys.has(k));
  });

  const updateCombos = useConstant(() => () => {
    for (const combo of comboKeys) {
      const key = `__combo__${combo}`;
      const obs = keyMap.get(key);
      if (obs) obs.set(isComboPressed(combo));
    }
  });

  const proxy = useConstant<UseMagicKeysReturn>(
    () =>
      new Proxy({} as UseMagicKeysReturn, {
        get(_target, prop: string) {
          if (prop === "current$") return current$;

          // Strip trailing $ and convert _ to + for destructuring support
          let key = prop;
          if (key.endsWith("$")) key = key.slice(0, -1);
          key = key.replace(/_/g, "+");

          if (key.includes("+")) {
            comboKeys.add(key);
            const comboKey = `__combo__${key}`;
            let obs = keyMap.get(comboKey);
            if (!obs) {
              obs = observable(false);
              keyMap.set(comboKey, obs);
            }
            return obs;
          }
          return getOrCreateKey(key);
        },
      })
  );

  const onKeyDown = useConstant(() => (e: KeyboardEvent) => {
    if (onEventFiredRef.current?.(e) === false) return;
    const key = resolveKey(e.key);
    pressedKeys.add(key);
    getOrCreateKey(e.key).set(true);
    current$.set(new Set(pressedKeys));
    updateCombos();
  });

  const onKeyUp = useConstant(() => (e: KeyboardEvent) => {
    if (onEventFiredRef.current?.(e) === false) return;
    const key = resolveKey(e.key);

    // macOS: when Meta is released, other keys don't receive keyup events.
    // Clear everything to avoid stuck keys.
    if (key === "meta") {
      pressedKeys.clear();
      for (const [, obs] of keyMap) {
        obs.set(false);
      }
      current$.set(new Set<string>());
      updateCombos();
      return;
    }

    pressedKeys.delete(key);
    getOrCreateKey(e.key).set(false);
    current$.set(new Set(pressedKeys));
    updateCombos();
  });

  const onBlur = useConstant(() => () => {
    pressedKeys.clear();
    for (const [, obs] of keyMap) {
      obs.set(false);
    }
    current$.set(new Set<string>());
  });

  useEventListener(window$, "keydown", onKeyDown, eventListenerOptions);
  useEventListener(window$, "keyup", onKeyUp, eventListenerOptions);
  useEventListener(window$, "blur", onBlur, eventListenerOptions);

  return proxy;
}
