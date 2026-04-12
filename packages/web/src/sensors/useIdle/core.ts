import { observable, type Observable, ObservableHint, type OpaqueObject } from "@legendapp/state";
import { onMount, type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import { createTimeoutFn } from "@usels/core/timer/useTimeoutFn/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

const DEFAULT_EVENTS = [
  "mousemove",
  "mousedown",
  "resize",
  "keydown",
  "touchstart",
  "wheel",
] as const;
const ONE_MINUTE = 60_000;

export interface UseIdleOptions extends ConfigurableWindow {
  /** Timeout in ms before idle state (default: 60000) */
  timeout?: number;
  /** Events to listen for activity (default: mousemove, mousedown, resize, keydown, touchstart, wheel) */
  events?: string[];
  /** Also listen to visibilitychange (default: true) */
  listenForVisibilityChange?: boolean;
  /** Initial idle state (default: false) */
  initialState?: boolean;
}

export interface UseIdleReturn {
  /** Whether the user is currently idle */
  idle$: ReadonlyObservable<boolean>;
  /** Timestamp of last user activity */
  lastActive$: ReadonlyObservable<number>;
  /** Reset the idle timer */
  reset: () => void;
}

/**
 * Framework-agnostic idle tracker.
 *
 * Monitors user interaction events (mouse, keyboard, touch, resize) and
 * sets `idle$` to `true` after a configurable timeout with no activity.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createIdle(options?: DeepMaybeObservable<UseIdleOptions>): UseIdleReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);
  const doc$ = observable<OpaqueObject<Document> | null>(() => {
    const doc = win$.get()?.document;
    return doc ? ObservableHint.opaque(doc) : null;
  });

  // Mount-time reads
  const events =
    (opts$.peek()?.events as string[] | undefined) ?? (DEFAULT_EVENTS as unknown as string[]);
  const initialState = opts$.peek()?.initialState ?? false;
  const listenForVisibilityChange = opts$.peek()?.listenForVisibilityChange ?? true;

  const idle$ = observable(initialState);
  const lastActive$ = observable(Date.now());

  const timeout$ = observable(() => opts$.timeout.get() ?? ONE_MINUTE);
  const { start } = createTimeoutFn(() => idle$.set(true), timeout$, { immediate: false });

  const reset = () => {
    idle$.set(false);
    start();
  };

  const onActivity = () => {
    lastActive$.set(Date.now());
    reset();
  };

  const onVisibilityChange = () => {
    if (!win$.peek()?.document.hidden) {
      onActivity();
    }
  };

  createEventListener(win$, events, onActivity, { passive: true });
  createEventListener(
    listenForVisibilityChange ? doc$ : null,
    "visibilitychange",
    onVisibilityChange,
    { passive: true }
  );

  onMount(() => {
    if (!initialState) reset();
  });

  return {
    idle$,
    lastActive$,
    reset,
  };
}
