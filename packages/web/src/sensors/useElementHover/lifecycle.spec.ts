// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useElementHover } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useElementHover() — element lifecycle", () => {
  describe("Observable target", () => {
    it("null → element: detects hover after mount", async () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);

      const { result } = renderHook(() => useElementHover(target$ as any));

      // Initially null — no listeners registered yet
      expect(result.current.get()).toBe(false);

      const el = document.createElement("div");
      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      // Now element is set — mouseenter should update state
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });

      expect(result.current.get()).toBe(true);
    });

    it("element → null: stops detecting hover", async () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useElementHover(target$ as any));

      // Flush so useObserve in useEventListener fires and registers listeners
      await act(flush);

      // Verify hover works initially
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      // Reset to false
      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(false);

      // Set target to null — listeners should be removed
      await act(async () => {
        target$.set(null);
        await flush();
      });

      // mouseenter on old element should have no effect
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });

      expect(result.current.get()).toBe(false);
    });

    it("full cycle: null → element → null → element works without leaks", async () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);

      const { result } = renderHook(() => useElementHover(target$ as any));

      const el1 = document.createElement("div");
      const addSpy1 = vi.spyOn(el1, "addEventListener");
      const removeSpy1 = vi.spyOn(el1, "removeEventListener");

      // Cycle 1: null → el1
      await act(async () => {
        target$.set(ObservableHint.opaque(el1));
        await flush();
      });

      // Verify el1 hover works
      act(() => {
        el1.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      // Cycle 2: el1 → null
      await act(async () => {
        target$.set(null);
        await flush();
      });

      // el1 listeners should be symmetric (no leaks)
      expect(addSpy1.mock.calls.length).toBe(removeSpy1.mock.calls.length);

      // mouseenter on el1 should have no effect
      act(() => {
        (result.current as any).set(false);
      });
      act(() => {
        el1.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(false);

      // Cycle 3: null → el2 (remount)
      const el2 = document.createElement("div");
      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });

      // el2 hover should work after remount
      act(() => {
        el2.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      act(() => {
        el2.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(false);
    });
  });
});
