"use client";
import type { ReadonlyObservable, DeepMaybeObservable } from "@usels/core";
import { useMaybeObservable, useInitialPick, useTimeoutFn } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { type OpaqueObject, ObservableHint } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useEventListener } from "../../browser/useEventListener";

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

/*@__NO_SIDE_EFFECTS__*/
export function useIdle(options?: DeepMaybeObservable<UseIdleOptions>): UseIdleReturn {
  const opts$ = useMaybeObservable(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);
  const doc$ = useObservable<OpaqueObject<Document> | null>(() => {
    const doc = window$.get()?.document;
    return doc ? ObservableHint.opaque(doc) : null;
  });

  const { events, initialState, listenForVisibilityChange } = useInitialPick(opts$, {
    events: DEFAULT_EVENTS as unknown as string[],
    initialState: false,
    listenForVisibilityChange: true,
  });

  const idle$ = useObservable(initialState);
  const initialLastActive = useConstant(() => Date.now());
  const lastActive$ = useObservable(initialLastActive);

  const timeout$ = useObservable(() => opts$.timeout.get() ?? ONE_MINUTE);
  const { start } = useTimeoutFn(() => idle$.set(true), timeout$, { immediate: false });

  const reset = useConstant(() => () => {
    idle$.set(false);
    start();
  });

  const onActivity = useConstant(() => () => {
    lastActive$.set(Date.now());
    reset();
  });

  const onVisibilityChange = useConstant(() => () => {
    if (!window$.peek()?.document.hidden) {
      onActivity();
    }
  });

  useEventListener(window$, events as string[], onActivity, { passive: true });
  useEventListener(
    listenForVisibilityChange ? doc$ : null,
    "visibilitychange",
    onVisibilityChange,
    { passive: true }
  );

  useMount(() => {
    if (!initialState) reset();
  });

  return {
    idle$,
    lastActive$,
    reset,
  };
}
