"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useMaybeObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { useEventListener } from "@browser/useEventListener";

export type KeyModifier =
  | "Alt"
  | "AltGraph"
  | "CapsLock"
  | "Control"
  | "Fn"
  | "FnLock"
  | "Meta"
  | "NumLock"
  | "ScrollLock"
  | "Shift"
  | "Symbol"
  | "SymbolLock";

const DEFAULT_EVENTS = ["mousedown", "mouseup", "keydown", "keyup"] as const;

export interface UseKeyModifierOptions<
  Initial extends boolean | null = null,
> extends ConfigurableWindow {
  /** Events to listen for modifier state changes */
  events?: string[];
  /** Initial value before any event fires */
  initial?: Initial;
}

export type UseKeyModifierReturn<Initial extends boolean | null = null> = ReadonlyObservable<
  Initial extends boolean ? boolean : boolean | null
>;

/*@__NO_SIDE_EFFECTS__*/
export function useKeyModifier<Initial extends boolean | null = null>(
  modifier: KeyModifier,
  options: UseKeyModifierOptions<Initial> = {}
): UseKeyModifierReturn<Initial> {
  const { events = DEFAULT_EVENTS as unknown as string[], initial = null as Initial } = options;

  const state$ = useObservable<boolean | null>(initial);

  const windowOpts$ = useMaybeObservable<ConfigurableWindow>(
    { window: options.window },
    { window: "element" }
  );
  const window$ = useResolvedWindow(windowOpts$.window);

  const handler = useConstant(() => (evt: Event) => {
    if (typeof (evt as KeyboardEvent).getModifierState === "function") {
      state$.set((evt as KeyboardEvent).getModifierState(modifier));
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEventListener(window$, events as any, handler, { passive: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state$ as any;
}
