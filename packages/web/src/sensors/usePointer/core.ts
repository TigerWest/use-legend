import { batch, type Observable } from "@legendapp/state";
import { peek, observable, type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export type UsePointerType = "mouse" | "touch" | "pen";

export interface UsePointerOptions extends ConfigurableWindow {
  /** Target element to listen on. Default: window */
  target?: MaybeEventTarget;
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

/**
 * Framework-agnostic reactive pointer tracker.
 *
 * Listens to `pointerdown` / `pointermove` / `pointerup` / `pointerleave`
 * on a target (default: window resolved via `resolveWindowSource`) and
 * exposes position, pressure, tilt, dimensions, twist, pointer type, and
 * inside state as observables.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPointer(options?: DeepMaybeObservable<UsePointerOptions>): UsePointerReturn {
  // Wrap options into a single observable so both `target` and `window` are
  // tracked reactively. The hook wrapper passes `target`/`window` via toObs
  // with the `"opaque"` hint, which prevents Legend-State from deep-proxying
  // DOM nodes / Window references stored inside.
  const opts$ = observable(options);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window field type varies by hint map
  const win$ = resolveWindowSource(opts$.window as any);

  // Decide at mount time whether the caller supplied a `target` option. If so,
  // pass the `opts$.target` observable (not a peeked value) so that Ref$/
  // Observable target changes propagate reactively through `normalizeTargets`
  // inside `createEventListener`. Otherwise, fall back to the reactive `win$`.
  const hasTarget =
    options != null &&
    typeof options === "object" &&
    "target" in (options as Record<string, unknown>);
  const eventTarget: Observable<unknown> = hasTarget
    ? (opts$.target as unknown as Observable<unknown>)
    : (win$ as unknown as Observable<unknown>);

  // pointerTypes is mount-time-only — a filter array snapshot is enough.
  const pointerTypes = peek(opts$.pointerTypes);

  const x$ = observable(0);
  const y$ = observable(0);
  const pressure$ = observable(0);
  const pointerId$ = observable(0);
  const tiltX$ = observable(0);
  const tiltY$ = observable(0);
  const width$ = observable(1);
  const height$ = observable(1);
  const twist$ = observable(0);
  const pointerType$ = observable<UsePointerType | null>(null);
  const isInside$ = observable(false);

  const handler = (e: PointerEvent) => {
    // isInside$ is set before pointerTypes filtering — any pointer entering
    // the target is considered "inside" regardless of its type.
    isInside$.set(true);
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
  };

  const onPointerLeave = () => {
    isInside$.set(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- union of MaybeEventTarget and reactive win$
  const target = eventTarget as any;
  createEventListener(target, "pointerdown", handler, { passive: true });
  createEventListener(target, "pointermove", handler, { passive: true });
  createEventListener(target, "pointerup", handler, { passive: true });
  createEventListener(target, "pointerleave", onPointerLeave, { passive: true });

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
