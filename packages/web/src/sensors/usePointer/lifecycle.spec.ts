// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { usePointer } from ".";

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    pressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    width: number;
    height: number;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
      this.pressure = init.pressure ?? 0;
      this.tiltX = init.tiltX ?? 0;
      this.tiltY = init.tiltY ?? 0;
      this.twist = init.twist ?? 0;
      this.width = init.width ?? 1;
      this.height = init.height ?? 1;
    }
  };
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePointer() — element lifecycle", () => {
  describe("Observable target", () => {
    it("Observable target with initial element: detects pointer events", async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => usePointer({ target: target$ as any }));

      await act(flush);

      // Fire pointer event on element
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: 100,
            clientY: 200,
            bubbles: true,
          })
        );
      });

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
      expect(result.current.isInside$.get()).toBe(true);

      document.body.removeChild(el);
    });

    it("pointerleave sets isInside$ to false", async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => usePointer({ target: target$ as any }));

      await act(flush);

      // Fire pointermove to set isInside to true
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 50, clientY: 50, bubbles: true })
        );
      });
      expect(result.current.isInside$.get()).toBe(true);

      // Fire pointerleave
      act(() => {
        el.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
      });
      expect(result.current.isInside$.get()).toBe(false);

      document.body.removeChild(el);
    });

    it("null target falls back to window and detects events", async () => {
      const { result } = renderHook(() => usePointer());

      await act(flush);

      // Fire pointer event on window
      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: 300,
            clientY: 400,
            bubbles: true,
          })
        );
      });

      expect(result.current.x$.get()).toBe(300);
      expect(result.current.y$.get()).toBe(400);
    });

    it("unmount cleans up listeners", async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));

      const { unmount } = renderHook(() => usePointer({ target: target$ as any }));

      await act(flush);

      const addCount = addSpy.mock.calls.length;
      expect(addCount).toBeGreaterThan(0);

      act(() => {
        unmount();
      });
      await act(flush);

      expect(removeSpy.mock.calls.length).toBe(addCount);

      document.body.removeChild(el);
    });
  });
});
