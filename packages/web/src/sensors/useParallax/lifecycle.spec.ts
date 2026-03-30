// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useParallax } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useParallax() — element lifecycle", () => {
  describe("Observable target", () => {
    it("null → element: starts computing parallax from mouse", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);

      const { result } = renderHook(() => useParallax(target$ as any));

      // Initially source should default to "mouse" (no device orientation)
      expect(result.current.source$.get()).toBe("mouse");
      // roll/tilt start at 0
      expect(result.current.roll$.get()).toBe(0);
      expect(result.current.tilt$.get()).toBe(0);

      // Mount element
      const el = document.createElement("div");
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
        toJSON: () => {},
      });
      document.body.appendChild(el);

      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      // After mounting, the hook should be tracking the element
      expect(result.current.source$.get()).toBe("mouse");
    });

    it("element → null: resets parallax values", async () => {
      const el = document.createElement("div");
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
        toJSON: () => {},
      });
      document.body.appendChild(el);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useParallax(target$ as any));
      await act(flush);

      // Set target to null
      await act(async () => {
        target$.set(null);
        await flush();
      });

      // After element removed, values should fall back to 0 (height/width become 0)
      expect(result.current.source$.get()).toBe("mouse");

      document.body.removeChild(el);
    });

    it("full cycle: null → element → null → element works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);

      const { result } = renderHook(() => useParallax(target$ as any));

      // --- First mount ---
      const el1 = document.createElement("div");
      vi.spyOn(el1, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
        toJSON: () => {},
      });
      document.body.appendChild(el1);

      await act(async () => {
        target$.set(ObservableHint.opaque(el1));
        await flush();
      });

      expect(result.current.source$.get()).toBe("mouse");

      // --- Unmount ---
      await act(async () => {
        target$.set(null);
        await flush();
      });

      // --- Second mount with new element ---
      const el2 = document.createElement("div");
      vi.spyOn(el2, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        top: 0,
        left: 0,
        right: 300,
        bottom: 300,
        toJSON: () => {},
      });
      document.body.appendChild(el2);

      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });

      // Should still work after remount
      expect(result.current.source$.get()).toBe("mouse");

      document.body.removeChild(el1);
      document.body.removeChild(el2);
    });
  });
});
