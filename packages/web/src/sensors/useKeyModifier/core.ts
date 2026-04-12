import { observable, type Observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

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

/**
 * Framework-agnostic reactive tracker for keyboard modifier key state.
 *
 * Uses `event.getModifierState()` to detect whether a modifier key
 * (Shift, Control, Alt, CapsLock, etc.) is currently active.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createKeyModifier<Initial extends boolean | null = null>(
  modifier: KeyModifier,
  options: UseKeyModifierOptions<Initial> = {} as UseKeyModifierOptions<Initial>
): UseKeyModifierReturn<Initial> {
  const { events = DEFAULT_EVENTS as unknown as string[], initial = null as Initial } = options;

  const state$ = observable<boolean | null>(initial);

  const win$ = resolveWindowSource(observable(options.window) as unknown as Observable<unknown>);

  const handler = (evt: Event) => {
    if (typeof (evt as KeyboardEvent).getModifierState === "function") {
      state$.set((evt as KeyboardEvent).getModifierState(modifier));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createEventListener(win$, events as any, handler, { passive: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state$ as any;
}
