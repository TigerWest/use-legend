import { observable, ObservableHint } from "@legendapp/state";
import {
  createSupported,
  onMount,
  peek,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Pausable,
  type Supportable,
} from "@usels/core";
import {
  type ConfigurableWindow,
  defaultDocument,
  resolveWindowSource,
} from "@shared/configurable";

export interface UseElementByPointOptions<M extends boolean = false> extends ConfigurableWindow {
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

/**
 * Framework-agnostic reactive element-at-point tracker using
 * `document.elementFromPoint()` (or `elementsFromPoint()` in multiple mode).
 *
 * Runs a `requestAnimationFrame` loop that polls the current (x, y) each frame
 * and syncs the result into `element$`. Pausable via `pause()` / `resume()`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createElementByPoint<M extends boolean = false>(
  options: DeepMaybeObservable<UseElementByPointOptions<M>>
): UseElementByPointReturn<M> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts$ = observable(options) as any;

  const isSupported$ = createSupported(
    () => !!defaultDocument && "elementFromPoint" in defaultDocument
  );

  const multiple = !!peek(opts$.peek()?.multiple);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element$ = observable<any>(multiple ? [] : null);
  const isActive$ = observable(true);

  const pause = () => {
    isActive$.set(false);
  };

  const resume = () => {
    isActive$.set(true);
  };

  onMount(() => {
    const win = resolveWindowSource(opts$.peek()?.window as unknown);
    if (!defaultDocument || !win) return;

    let rafId: number | undefined;

    const loop = () => {
      if (isActive$.peek()) {
        const raw = opts$.peek();
        const cx = peek(raw?.x) as number;
        const cy = peek(raw?.y) as number;
        if (multiple) {
          const newElements = defaultDocument!.elementsFromPoint(cx, cy);
          const prev = element$.peek() as Element[];
          if (
            newElements.length !== prev.length ||
            newElements.some((el: Element, i: number) => el !== prev[i])
          ) {
            element$.set(ObservableHint.opaque(newElements));
          }
        } else {
          const el = defaultDocument!.elementFromPoint(cx, cy);
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
    isActive$: isActive$ as ReadonlyObservable<boolean>,
    pause,
    resume,
  } as UseElementByPointReturn<M>;
}
