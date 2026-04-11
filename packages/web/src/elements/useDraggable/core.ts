import { batch, observable, type Observable } from "@legendapp/state";
import { peek, type DeepMaybeObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface Position {
  x: number;
  y: number;
}

export interface UseDraggableOptions extends ConfigurableWindow {
  /** Only start drag if pointerdown target exactly matches the element. Default: false */
  exact?: boolean;
  /** Call preventDefault on pointer events. Default: false */
  preventDefault?: boolean;
  /** Call stopPropagation on pointer events. Default: false */
  stopPropagation?: boolean;
  /** Use capture phase for pointerdown. Default: false */
  capture?: boolean;
  /** Restrict drag to a specific handle element */
  handle?: MaybeEventTarget;
  /** Clamp drag position inside this container element */
  containerElement?: MaybeEventTarget;
  /** Initial position. Read once at mount time. Default: { x: 0, y: 0 } */
  initialValue?: Position;
  /** Called on drag start. Return false to cancel. */
  onStart?: (position: Position, event: PointerEvent) => void | false;
  /** Called on each drag move */
  onMove?: (position: Position, event: PointerEvent) => void;
  /** Called on drag end */
  onEnd?: (position: Position, event: PointerEvent) => void;
  /** Restrict movement axis. Default: 'both' */
  axis?: "x" | "y" | "both";
  /** Disable dragging */
  disabled?: boolean;
  /** Filter by pointer type. Default: all types allowed */
  pointerTypes?: Array<"mouse" | "pen" | "touch">;
  /** Clamp drag position inside the viewport. Default: false */
  restrictInView?: boolean;
}

export interface UseDraggableReturn {
  /** Current X position */
  x$: Observable<number>;
  /** Current Y position */
  y$: Observable<number>;
  /** Current position as { x, y } */
  position$: Observable<Position>;
  /** Whether currently dragging */
  isDragging$: Observable<boolean>;
  /** CSS position string: "left: Xpx; top: Ypx;" */
  style$: Observable<string>;
}

/**
 * Framework-agnostic draggable Pointer-Events wrapper.
 *
 * Must be called inside a `useScope` factory — pointer listeners are
 * registered via `createEventListener` and cleaned up automatically when the
 * scope disposes. Public behavior matches the legacy `useDraggable` hook.
 *
 * @param target - Element to make draggable (`Ref$`, `Observable<Element|null>`, raw Element, etc.).
 * @param options - Configuration (supports `DeepMaybeObservable` — each field may be an Observable).
 */
export function createDraggable(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseDraggableOptions>
): UseDraggableReturn {
  const opts$ = observable(options) as unknown as Observable<UseDraggableOptions>;
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  // Mount-time-only: initial position.
  const initial = opts$.peek()?.initialValue ?? { x: 0, y: 0 };

  const x$ = observable<number>(initial.x);
  const y$ = observable<number>(initial.y);
  const isDragging$ = observable<boolean>(false);

  const position$ = observable<Position>(() => ({ x: x$.get(), y: y$.get() }));
  const style$ = observable<string>(() => `left: ${x$.get()}px; top: ${y$.get()}px;`);

  // Offset between pointer and element top-left at drag start.
  let pressedDelta: Position | null = null;

  const onPointerDown = (e: PointerEvent) => {
    const o = opts$.peek();
    if (o?.disabled) return;

    const el = peek(target) as HTMLElement | null;
    if (!el) return;
    if (o?.exact && e.target !== el) return;

    const pointerTypes = o?.pointerTypes;
    if (pointerTypes && !pointerTypes.includes(e.pointerType as "mouse" | "pen" | "touch")) return;

    if (o?.preventDefault) e.preventDefault();
    if (o?.stopPropagation) e.stopPropagation();

    const rect = el.getBoundingClientRect();
    const pos: Position = { x: rect.left, y: rect.top };

    if (o?.onStart?.(pos, e) === false) return;

    // Store (mouseX - cssLeft) so that onPointerMove gives: mouseX - delta = cssLeft + mouseDelta.
    pressedDelta = {
      x: e.clientX - x$.peek(),
      y: e.clientY - y$.peek(),
    };
    isDragging$.set(true);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pressedDelta) return;
    const o = opts$.peek();
    if (o?.preventDefault) e.preventDefault();

    let x = e.clientX - pressedDelta.x;
    let y = e.clientY - pressedDelta.y;

    // Axis restriction.
    const axis = o?.axis;
    if (axis === "x") y = y$.peek();
    if (axis === "y") x = x$.peek();

    // Container boundary clamping.
    const container = o?.containerElement as unknown as HTMLElement | null | undefined;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = (peek(target) as HTMLElement | null)?.getBoundingClientRect();
      if (elRect) {
        x = Math.max(containerRect.left, Math.min(x, containerRect.right - elRect.width));
        y = Math.max(containerRect.top, Math.min(y, containerRect.bottom - elRect.height));
      }
    }

    // Viewport restriction.
    const win = win$.peek() as Window | null;
    if (o?.restrictInView && win) {
      const elRect = (peek(target) as HTMLElement | null)?.getBoundingClientRect();
      if (elRect) {
        x = Math.max(0, Math.min(x, win.innerWidth - elRect.width));
        y = Math.max(0, Math.min(y, win.innerHeight - elRect.height));
      }
    }

    batch(() => {
      x$.set(x);
      y$.set(y);
    });
    o?.onMove?.({ x, y }, e);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!pressedDelta) return;
    pressedDelta = null;
    const pos: Position = { x: x$.peek(), y: y$.peek() };
    isDragging$.set(false);
    opts$.peek()?.onEnd?.(pos, e);
  };

  // Determine pointerdown target: handle if specified (mount-time), otherwise target.
  // When handle is provided as a reactive source (Ref$ / Observable), `opts$.handle`
  // tracks its changes so `createEventListener` re-binds automatically.
  const handlePeek = opts$.peek()?.handle;
  const pointerdownTarget: MaybeEventTarget =
    handlePeek != null ? (opts$.handle as unknown as MaybeEventTarget) : target;

  createEventListener(pointerdownTarget, "pointerdown", onPointerDown, {
    capture: opts$.peek()?.capture ?? false,
  });

  createEventListener(win$ as unknown as Observable<unknown>, "pointermove", onPointerMove);
  createEventListener(win$ as unknown as Observable<unknown>, "pointerup", onPointerUp);

  return {
    x$,
    y$,
    position$,
    isDragging$,
    style$,
  };
}
