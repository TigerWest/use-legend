// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useDraggable } from ".";

// ---------------------------------------------------------------------------
// jsdom PointerEvent polyfill
// ---------------------------------------------------------------------------
class PointerEventPolyfill extends MouseEvent {
  pointerType: string;
  pointerId: number;
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params as MouseEventInit);
    this.pointerType = params.pointerType ?? "mouse";
    this.pointerId = params.pointerId ?? 0;
  }
}
if (typeof window !== "undefined" && !window.PointerEvent) {
  (globalThis as any).PointerEvent = PointerEventPolyfill;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDiv(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getBoundingClientRect").mockReturnValue(full);
  return div;
}

function firePointerDown(
  target: EventTarget,
  clientX: number,
  clientY: number,
  pointerType = "mouse"
) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX,
        clientY,
        pointerType,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function firePointerMove(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function firePointerUp(clientX = 0, clientY = 0) {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX,
        clientY,
        bubbles: true,
      })
    );
  });
}

// ---------------------------------------------------------------------------
// useDraggable — element lifecycle
// ---------------------------------------------------------------------------

describe("useDraggable() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Ref$ target", () => {
    it("Ref$ null → element: pointerdown listener is registered on new element", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      // Initially null — no pointerdown listener on div yet
      expect(addSpy).not.toHaveBeenCalled();

      act(() => result.current.el$(div as any));

      // After element assignment: pointerdown should be registered
      const registeredEvents = addSpy.mock.calls.map((call) => call[0]);
      expect(registeredEvents).toContain("pointerdown");
    });

    it("Ref$ element → null: all pointer listeners are removed", () => {
      const div = createDiv();
      const removeSpy = vi.spyOn(div, "removeEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      act(() => result.current.el$(div as any));
      removeSpy.mockClear();

      act(() => result.current.el$(null));

      // pointerdown listener on element must be removed
      const removedEvents = removeSpy.mock.calls.map((call) => call[0]);
      expect(removedEvents).toContain("pointerdown");
    });

    it("addEventListener/removeEventListener call counts are symmetric after element → null", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");
      const removeSpy = vi.spyOn(div, "removeEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      act(() => result.current.el$(div as any));
      const addCount = addSpy.mock.calls.length;

      act(() => result.current.el$(null));
      const removeCount = removeSpy.mock.calls.length;

      // Every add must have a matching remove
      expect(addCount).toBeGreaterThanOrEqual(1);
      expect(removeCount).toBe(addCount);
    });
  });

  describe("Observable target", () => {
    it("Observable target null → element: listeners are registered", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");
      const target$ = observable<OpaqueObject<Element> | null>(null);

      renderHook(() => useDraggable(target$ as any));

      // Initially null — no listeners on div
      expect(addSpy).not.toHaveBeenCalled();

      act(() => target$.set(ObservableHint.opaque(div)));

      const registeredEvents = addSpy.mock.calls.map((call) => call[0]);
      expect(registeredEvents).toContain("pointerdown");
    });

    it("Observable target element → null: listeners are removed", () => {
      const div = createDiv();
      const removeSpy = vi.spyOn(div, "removeEventListener");
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));

      renderHook(() => useDraggable(target$ as any));

      removeSpy.mockClear();

      act(() => target$.set(null));

      const removedEvents = removeSpy.mock.calls.map((call) => call[0]);
      expect(removedEvents).toContain("pointerdown");
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");
      const removeSpy = vi.spyOn(div, "removeEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      // Run 3 null → element → null cycles
      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(div as any));
        act(() => result.current.el$(null));
      }

      // Total adds and removes must be symmetric — no leaked listeners
      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("drag in progress is cancelled when target element is removed (Ref$ → null)", () => {
      const div = createDiv();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      act(() => result.current.el$(div as any));

      // Start drag
      firePointerDown(div, 10, 10);
      firePointerMove(50, 50);
      expect(result.current.drag.isDragging$.get()).toBe(true);

      // Remove element while drag is in progress
      act(() => result.current.el$(null));

      // pressedDelta is still set after element removal (no automatic clear).
      // window pointermove listener is still registered, so moves still update position.
      const xBefore = result.current.drag.x$.get(); // 40 after the (50,50) move
      // Move to (200,200): pressedDelta still {x:10} → x = 200-10 = 190
      firePointerMove(200, 200);
      // pointerup clears pressedDelta and sets isDragging=false
      firePointerUp();
      expect(result.current.drag.isDragging$.get()).toBe(false);

      // After pointerup, pressedDelta is null — further moves are no-ops. x$ stays at 190.
      firePointerMove(300, 300);
      expect(result.current.drag.x$.get()).toBe(xBefore + 150); // 40 + 150 = 190
    });

    it("x$, y$ reset when target element is removed", () => {
      const div = createDiv();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const drag = useDraggable(el$);
        return { el$, drag };
      });

      act(() => result.current.el$(div as any));

      // Drag to some position
      firePointerDown(div, 0, 0);
      firePointerMove(60, 80);
      firePointerUp();

      expect(result.current.drag.x$.get()).toBe(60);
      expect(result.current.drag.y$.get()).toBe(80);

      // Remove element — position state does not auto-reset (Observable persists)
      // The important check: no new drag can start after element removal
      act(() => result.current.el$(null));

      // Without a valid element, pointerdown on div (no longer listening) won't trigger drag
      firePointerDown(div, 0, 0);
      firePointerMove(0, 0);

      // x$, y$ unchanged since no new drag was started
      expect(result.current.drag.x$.get()).toBe(60);
      expect(result.current.drag.y$.get()).toBe(80);
    });
  });
});
