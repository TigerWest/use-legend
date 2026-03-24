"use client";
import type { ReadonlyObservable, Pausable, Supportable } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { ObservableHint } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import {
  type ConfigurableWindow,
  type ConfigurableDocument,
  defaultDocument,
} from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

export interface UseElementByPointOptions<M extends boolean = false>
  extends ConfigurableWindow, ConfigurableDocument {
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
  const opts$ = useMaybeObservable(options, { window: "element", document: "element" }) as any;
  const window$ = useResolvedWindow(opts$.window);

  // Document: explicit options.document or derive from resolved window
  const doc = opts$.document?.peek() ?? defaultDocument;

  const isSupported$ = useSupported(() => !!doc && "elementFromPoint" in doc);

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
    const win = window$.peek();
    if (!doc || !win) return;

    let rafId: number | undefined;

    const loop = () => {
      if (isActive$.peek()) {
        const cx = opts$.x.get() as number;
        const cy = opts$.y.get() as number;
        if (multiple) {
          const newElements = doc.elementsFromPoint(cx, cy);
          const prev = element$.peek() as Element[];
          if (
            newElements.length !== prev.length ||
            newElements.some((el: Element, i: number) => el !== prev[i])
          ) {
            element$.set(ObservableHint.opaque(newElements));
          }
        } else {
          const el = doc.elementFromPoint(cx, cy);
          if (el !== element$.peek()) {
            element$.set(el ? ObservableHint.opaque(el) : null);
          }
        }
      }
      rafId = win.requestAnimationFrame(loop);
    };

    rafId = win.requestAnimationFrame(loop);

    return () => {
      if (rafId !== undefined) {
        win.cancelAnimationFrame(rafId);
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
