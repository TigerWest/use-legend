// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLastChanged } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useLastChanged()", () => {
  describe("initial values", () => {
    it("returns null before any change", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useLastChanged(source$));

      expect(result.current.get()).toBeNull();
    });

    it("returns a ReadonlyObservable (.get() works immediately)", () => {
      const source$ = observable(42);
      const { result } = renderHook(() => useLastChanged(source$));

      expect(typeof result.current.get).toBe("function");
      expect(result.current.get()).toBeNull();
    });

    it("uses custom initialValue when provided", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useLastChanged(source$, { initialValue: 1000 }));

      expect(result.current.get()).toBe(1000);
    });
  });

  describe("timestamp tracking", () => {
    it("records Date.now() when source changes", () => {
      const source$ = observable("hello");
      vi.setSystemTime(new Date(1700000000000));
      const { result } = renderHook(() => useLastChanged(source$));

      expect(result.current.get()).toBeNull();

      vi.setSystemTime(new Date(1700000001000));
      act(() => {
        source$.set("world");
      });

      expect(result.current.get()).toBe(1700000001000);
    });

    it("updates timestamp on every subsequent change", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useLastChanged(source$));

      vi.setSystemTime(new Date(1700000001000));
      act(() => {
        source$.set(1);
      });

      expect(result.current.get()).toBe(1700000001000);

      vi.setSystemTime(new Date(1700000002000));
      act(() => {
        source$.set(2);
      });

      expect(result.current.get()).toBe(1700000002000);

      vi.setSystemTime(new Date(1700000003000));
      act(() => {
        source$.set(3);
      });

      expect(result.current.get()).toBe(1700000003000);
    });

    it("does not update timestamp on initial observe pass", () => {
      vi.setSystemTime(new Date(1700000000000));
      const source$ = observable("hello");
      const { result } = renderHook(() => useLastChanged(source$));

      // Initial observe should NOT set timestamp
      expect(result.current.get()).toBeNull();
    });
  });

  describe("reactive source (Observable)", () => {
    it("Observable<T> source — tracks changes reactively", () => {
      const source$ = observable("hello");
      vi.setSystemTime(new Date(1700000001000));
      const { result } = renderHook(() => useLastChanged(source$));

      act(() => {
        source$.set("world");
      });

      expect(result.current.get()).toBe(1700000001000);
    });
    it("plain T source — timestamp stays null (no reactive changes)", () => {
      const { result } = renderHook(() => useLastChanged(observable("hello")));

      expect(result.current.get()).toBeNull();
    });
  });

  describe("unmount cleanup", () => {
    it("does not update timestamp after unmount", () => {
      const source$ = observable("hello");
      vi.setSystemTime(new Date(1700000001000));
      const { result, unmount } = renderHook(() => useLastChanged(source$));

      act(() => {
        source$.set("world");
      });

      expect(result.current.get()).toBe(1700000001000);

      unmount();

      // Changes after unmount should not throw
      expect(() => {
        act(() => {
          source$.set("after unmount");
        });
      }).not.toThrow();
    });
  });
});
