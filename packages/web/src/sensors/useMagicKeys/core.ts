import { observable, type Observable } from "@legendapp/state";
import { onUnmount, type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

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

/**
 * Framework-agnostic magic keys tracker.
 *
 * Tracks keyboard state via `keydown`/`keyup`/`blur` events on window.
 * Returns a Proxy that exposes any key as a reactive boolean observable,
 * and supports combo keys (e.g. `ctrl+a`).
 */
/*@__NO_SIDE_EFFECTS__*/
export function createMagicKeys(
  options?: DeepMaybeObservable<UseMagicKeysOptions>
): UseMagicKeysReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  // Mount-time reads
  const aliasMap = opts$.peek()?.aliasMap ?? {};
  const eventListenerOptions = (opts$.peek()?.eventListenerOptions ?? {
    passive: true,
  }) as AddEventListenerOptions;

  const mergedAliases: Record<string, string> = { ...DEFAULT_ALIAS_MAP, ...aliasMap };
  const keyMap = new Map<string, Observable<boolean>>();
  const comboKeys = new Set<string>();
  const pressedKeys = new Set<string>();
  const current$ = observable<Set<string>>(new Set());

  const resolveKey = (key: string): string => {
    const lower = key.toLowerCase();
    return mergedAliases[lower] ?? lower;
  };

  const getOrCreateKey = (key: string): Observable<boolean> => {
    const resolved = resolveKey(key);
    let obs = keyMap.get(resolved);
    if (!obs) {
      obs = observable(false);
      keyMap.set(resolved, obs);
    }
    return obs;
  };

  const isComboPressed = (combo: string): boolean => {
    return combo
      .split("+")
      .map((p) => resolveKey(p.trim()))
      .every((k) => pressedKeys.has(k));
  };

  const updateCombos = () => {
    for (const combo of comboKeys) {
      const key = `__combo__${combo}`;
      const obs = keyMap.get(key);
      if (obs) obs.set(isComboPressed(combo));
    }
  };

  const proxy = new Proxy({} as UseMagicKeysReturn, {
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
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const onEventFired = opts$.peek()?.onEventFired as
      | ((e: KeyboardEvent) => boolean | void)
      | undefined;
    if (onEventFired?.(e) === false) return;
    const key = resolveKey(e.key);
    pressedKeys.add(key);
    getOrCreateKey(e.key).set(true);
    current$.set(new Set(pressedKeys));
    updateCombos();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const onEventFired = opts$.peek()?.onEventFired as
      | ((e: KeyboardEvent) => boolean | void)
      | undefined;
    if (onEventFired?.(e) === false) return;
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
  };

  const onBlur = () => {
    pressedKeys.clear();
    for (const [, obs] of keyMap) {
      obs.set(false);
    }
    current$.set(new Set<string>());
  };

  createEventListener(win$, "keydown", onKeyDown, eventListenerOptions);
  createEventListener(win$, "keyup", onKeyUp, eventListenerOptions);
  createEventListener(win$, "blur", onBlur, eventListenerOptions);

  onUnmount(() => {
    pressedKeys.clear();
    keyMap.clear();
    comboKeys.clear();
  });

  return proxy;
}
