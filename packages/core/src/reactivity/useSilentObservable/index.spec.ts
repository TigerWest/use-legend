// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useSilentObservable } from ".";

describe("useSilentObservable()", () => {
  describe("initial value", () => {
    it("returns Observable with initial value", () => {
      const { result } = renderHook(() => useSilentObservable(42));
      expect(result.current.get()).toBe(42);
    });

    it("has silentSet method", () => {
      const { result } = renderHook(() => useSilentObservable(0));
      expect(typeof result.current.silentSet).toBe("function");
    });

    it("preserves standard Observable methods", () => {
      const { result } = renderHook(() => useSilentObservable("hello"));
      expect(typeof result.current.get).toBe("function");
      expect(typeof result.current.peek).toBe("function");
      expect(typeof result.current.set).toBe("function");
      expect(typeof result.current.onChange).toBe("function");
    });
  });

  describe("silentSet()", () => {
    it("updates the value immediately", () => {
      const { result } = renderHook(() => useSilentObservable(0));

      act(() => {
        result.current.silentSet(99);
      });

      expect(result.current.peek()).toBe(99);
    });

    it("does not trigger onChange listeners", () => {
      const { result } = renderHook(() => useSilentObservable(0));
      const listener = vi.fn();

      act(() => {
        result.current.onChange(listener);
      });

      act(() => {
        result.current.silentSet(99);
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it("multiple silentSet uses the last value", () => {
      const { result } = renderHook(() => useSilentObservable(0));

      act(() => {
        result.current.silentSet(1);
        result.current.silentSet(2);
        result.current.silentSet(3);
      });

      expect(result.current.peek()).toBe(3);
    });
  });

  describe("set()", () => {
    it("updates Observable immediately (standard set)", () => {
      const { result } = renderHook(() => useSilentObservable(0));

      act(() => {
        result.current.set(77);
      });

      expect(result.current.get()).toBe(77);
    });

    it("triggers onChange listeners", () => {
      const { result } = renderHook(() => useSilentObservable(0));
      const listener = vi.fn();

      act(() => {
        result.current.onChange(listener);
      });

      act(() => {
        result.current.set(10);
      });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw when silentSet is called after unmount", () => {
      const { result, unmount } = renderHook(() => useSilentObservable(0));
      const ref = result.current;

      unmount();

      expect(() => ref.silentSet(99)).not.toThrow();
    });
  });
});
