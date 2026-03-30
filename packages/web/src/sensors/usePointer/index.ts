"use client";
import type { ReadonlyObservable, DeepMaybeObservable, MaybeElement } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { batch } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useEventListener } from "@browser/useEventListener";

export type UsePointerType = "mouse" | "touch" | "pen";

export interface UsePointerOptions extends ConfigurableWindow {
  /** Target element to listen on. Default: window */
  target?: MaybeElement;
  /** Pointer types to listen for. Default: all types */
  pointerTypes?: UsePointerType[];
}

export interface UsePointerReturn {
  /** X coordinate */
  x$: ReadonlyObservable<number>;
  /** Y coordinate */
  y$: ReadonlyObservable<number>;
  /** Pointer pressure (0-1) */
  pressure$: ReadonlyObservable<number>;
  /** Unique pointer identifier */
  pointerId$: ReadonlyObservable<number>;
  /** Tilt angle on X axis (-90 to 90) */
  tiltX$: ReadonlyObservable<number>;
  /** Tilt angle on Y axis (-90 to 90) */
  tiltY$: ReadonlyObservable<number>;
  /** Contact geometry width */
  width$: ReadonlyObservable<number>;
  /** Contact geometry height */
  height$: ReadonlyObservable<number>;
  /** Clockwise rotation (0-359) */
  twist$: ReadonlyObservable<number>;
  /** Pointer device type */
  pointerType$: ReadonlyObservable<UsePointerType | null>;
  /** Whether pointer is inside the target */
  isInside$: ReadonlyObservable<boolean>;
}

/*@__NO_SIDE_EFFECTS__*/
export function usePointer(options?: DeepMaybeObservable<UsePointerOptions>): UsePointerReturn {
  const opts$ = useMaybeObservable(options, {
    target: "element",
    window: "element",
  });
  const window$ = useResolvedWindow(opts$.window);
  const x$ = useObservable(0);
  const y$ = useObservable(0);
  const pressure$ = useObservable(0);
  const pointerId$ = useObservable(0);
  const tiltX$ = useObservable(0);
  const tiltY$ = useObservable(0);
  const width$ = useObservable(1);
  const height$ = useObservable(1);
  const twist$ = useObservable(0);
  const pointerType$ = useObservable<UsePointerType | null>(null);
  const isInside$ = useObservable(false);

  const eventTarget: MaybeElement = useConstant(() => {
    const hasTarget = options != null && "target" in (options as object);
    if (hasTarget) {
      return opts$.target as unknown as MaybeElement;
    }
    return (window$ ?? defaultWindow ?? null) as unknown as MaybeElement;
  });

  const handler = useConstant(() => (e: PointerEvent) => {
    // isInside$ is set before pointerTypes filtering — any pointer entering
    // the target is considered "inside" regardless of its type.
    isInside$.set(true);
    const pointerTypes = opts$.pointerTypes.peek();
    if (pointerTypes && !pointerTypes.includes(e.pointerType as UsePointerType)) return;

    batch(() => {
      x$.set(e.clientX);
      y$.set(e.clientY);
      pressure$.set(e.pressure);
      pointerId$.set(e.pointerId);
      tiltX$.set(e.tiltX);
      tiltY$.set(e.tiltY);
      width$.set(e.width);
      height$.set(e.height);
      twist$.set(e.twist);
      pointerType$.set(e.pointerType as UsePointerType);
    });
  });

  const onPointerLeave = useConstant(() => () => {
    isInside$.set(false);
  });

  useEventListener(eventTarget, "pointerdown", handler, { passive: true });
  useEventListener(eventTarget, "pointermove", handler, { passive: true });
  useEventListener(eventTarget, "pointerup", handler, { passive: true });
  useEventListener(eventTarget, "pointerleave", onPointerLeave, { passive: true });

  return {
    x$,
    y$,
    pressure$,
    pointerId$,
    tiltX$,
    tiltY$,
    width$,
    height$,
    twist$,
    pointerType$,
    isInside$,
  };
}
