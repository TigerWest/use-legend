// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useObserveDebounced } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useObserveDebounced()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount (no debounce timer started)", () => {
      const effect = vi.fn();
      renderHook(() => useObserveDebounced(() => 0, effect, { ms: 300 }));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect after ms delay on mount", () => {
      const effect = vi.fn();
      renderHook(() => useObserveDebounced(() => 0, effect, { ms: 300, immediate: true }));

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(effect).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("debounce timing", () => {
    it("calls effect after ms delay when observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObserveDebounced(() => count$.get(), effect, { ms: 300 }));

      act(() => {
        count$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(effect).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });

    it("uses default 200ms delay when ms not provided", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObserveDebounced(() => count$.get(), effect));

      act(() => {
        count$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(effect).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(effect).toHaveBeenCalledTimes(1);
    });

    it("resets debounce window on each observable change", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObserveDebounced(() => count$.get(), effect, { ms: 300 }));

      act(() => {
        count$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      act(() => {
        count$.set(2);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(2);
    });
  });

  describe("options", () => {
    it("maxWait — forces execution before debounce window expires", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveDebounced(() => count$.get(), effect, { ms: 300, maxWait: 500, immediate: true })
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(effect).toHaveBeenCalled();
    });
  });

  describe("latest closure", () => {
    it("uses the latest effect reference when debounce fires", () => {
      const count$ = observable(0);
      const calls: string[] = [];

      const { rerender } = renderHook(
        ({ label }) =>
          useObserveDebounced(
            () => count$.get(),
            () => {
              calls.push(label);
            },
            { ms: 300 }
          ),
        { initialProps: { label: "initial" } }
      );

      act(() => {
        count$.set(1);
      });

      rerender({ label: "updated" });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(calls).toEqual(["updated"]);
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw when pending timer fires after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { unmount } = renderHook(() =>
        useObserveDebounced(() => count$.get(), effect, { ms: 300 })
      );

      act(() => {
        count$.set(1);
      });
      unmount();

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });
});
