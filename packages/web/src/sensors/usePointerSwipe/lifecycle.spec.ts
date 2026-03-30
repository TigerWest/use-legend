// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { usePointerSwipe } from ".";

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firePointerDown(target: EventTarget, x = 0, y = 0) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", { clientX: x, clientY: y, buttons: 1, bubbles: true })
    );
  });
}

function firePointerMove(target: EventTarget, x = 0, y = 0) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointermove", { clientX: x, clientY: y, buttons: 1, bubbles: true })
    );
  });
}

function firePointerUp(target: EventTarget, x = 0, y = 0) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerup", { clientX: x, clientY: y, buttons: 0, bubbles: true })
    );
  });
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePointerSwipe() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable target", () => {
    it("null → element: starts detecting pointer swipe", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));

      // Verify no swipe while target is null
      expect(result.current.direction$.get()).toBe("none");

      // Mount element
      const div = document.createElement("div");
      document.body.appendChild(div);
      act(() => target$.set(ObservableHint.opaque(div)));
      await act(flush);

      // Fire swipe gesture: move right 60px (dx = 0 - 60 = -60, so direction = "right")
      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);

      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);

      firePointerUp(div, 60, 0);
      document.body.removeChild(div);
    });

    it("element → null: stops detecting pointer swipe", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));

      await act(flush);

      // Verify it works first
      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);
      expect(result.current.direction$.get()).toBe("right");
      firePointerUp(div, 60, 0);

      // Unmount element — set target to null
      act(() => target$.set(null));
      await act(flush);

      // Reset by dispatching a pointerup to clear state
      // Then try a new gesture — should not update direction
      firePointerDown(div, 0, 0);
      firePointerMove(div, 100, 0);

      // direction$ should remain at previous end state ("none" after pointerup) or not update further
      // The key assertion: hook is no longer listening on div
      result.current.direction$.get();
      // Should be "none" (reset after pointerup) since hook no longer listens
      expect(result.current.isSwiping$.get()).toBe(false);

      document.body.removeChild(div);
    });

    it("full cycle: null → element → null → element works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));

      // --- First mount ---
      const div1 = document.createElement("div");
      document.body.appendChild(div1);
      act(() => target$.set(ObservableHint.opaque(div1)));
      await act(flush);

      firePointerDown(div1, 0, 0);
      firePointerMove(div1, 60, 0);
      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);
      firePointerUp(div1, 60, 0);

      // --- Unmount ---
      act(() => target$.set(null));
      await act(flush);

      // direction$ should be "none" after pointerup reset
      expect(result.current.isSwiping$.get()).toBe(false);

      // --- Second mount with a new element ---
      const div2 = document.createElement("div");
      document.body.appendChild(div2);
      act(() => target$.set(ObservableHint.opaque(div2)));
      await act(flush);

      // Should work on new element
      firePointerDown(div2, 0, 0);
      firePointerMove(div2, 0, 60);
      // dy = 0 - 60 = -60, so direction = "down"
      expect(result.current.direction$.get()).toBe("down");
      expect(result.current.isSwiping$.get()).toBe(true);
      firePointerUp(div2, 0, 60);

      // Old element should not trigger
      firePointerDown(div1, 0, 0);
      firePointerMove(div1, 100, 0);
      // direction$ should have been reset to "none" by pointerup above
      // and div1 events should not update it
      expect(result.current.isSwiping$.get()).toBe(false);

      document.body.removeChild(div1);
      document.body.removeChild(div2);
    });
  });
});
