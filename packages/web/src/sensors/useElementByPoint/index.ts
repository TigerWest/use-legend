"use client";
import type { ReadonlyObservable, Pausable, Supportable } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { ObservableHint } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultDocument, defaultWindow } from "@shared/configurable";

export interface UseElementByPointOptions<M extends boolean = false> {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Whether to return multiple elements (uses elementsFromPoint) */
  multiple?: M;
}

export type UseElementByPointReturn<M extends boolean = false> = Pausable &
  Supportable & {
    /** Element(s) at the specified point */
    element$: ReadonlyObservable<M extends true ? Element[] : Element | null>;
  };

/*@__NO_SIDE_EFFECTS__*/
export function useElementByPoint<M extends boolean = false>(
  options: DeepMaybeObservable<UseElementByPointOptions<M>>
): UseElementByPointReturn<M> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts$ = useMaybeObservable(options) as any;

  const isSupported$ = useSupported(
    () => !!defaultDocument && "elementFromPoint" in defaultDocument
  );

  const multiple = useConstant(() => !!opts$.multiple?.peek());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element$ = useObservable<any>(multiple ? [] : null);
  const isActive$ = useObservable(true);

  const pause = useConstant(() => () => {
    isActive$.set(false);
  });

  const resume = useConstant(() => () => {
    isActive$.set(true);
  });

  useMount(() => {
    if (!defaultDocument || !defaultWindow) return;

    let rafId: number | undefined;

    const loop = () => {
      if (isActive$.peek()) {
        const cx = opts$.x.get() as number;
        const cy = opts$.y.get() as number;
        if (multiple) {
          const newElements = defaultDocument!.elementsFromPoint(cx, cy);
          const prev = element$.peek() as Element[];
          if (newElements.length !== prev.length || newElements.some((el, i) => el !== prev[i])) {
            element$.set(ObservableHint.opaque(newElements));
          }
        } else {
          const el = defaultDocument!.elementFromPoint(cx, cy);
          if (el !== element$.peek()) {
            element$.set(el ? ObservableHint.opaque(el) : null);
          }
        }
      }
      rafId = defaultWindow!.requestAnimationFrame(loop);
    };

    rafId = defaultWindow!.requestAnimationFrame(loop);

    return () => {
      if (rafId !== undefined) {
        defaultWindow!.cancelAnimationFrame(rafId);
      }
    };
  });

  return {
    isSupported$,
    element$,
    isActive$,
    pause,
    resume,
  } as UseElementByPointReturn<M>;
}
