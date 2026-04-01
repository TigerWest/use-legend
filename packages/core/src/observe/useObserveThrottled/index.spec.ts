// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useObserveThrottled } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useObserveThrottled()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const effect = vi.fn();
      renderHook(() => useObserveThrottled(() => 0, effect, { ms: 300 }));
      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect immediately on mount (leading edge)", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, immediate: true })
      );
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });
  });

  describe("throttle timing", () => {
    it("calls effect on first observable change (leading edge)", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObserveThrottled(() => count$.get(), effect, { ms: 300 }));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });

    it("calls effect at most once within throttle window", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, immediate: true })
      );

      expect(effect).toHaveBeenCalledTimes(1); // leading on mount

      act(() => {
        count$.set(1);
        count$.set(2);
        count$.set(3);
      });

      expect(effect).toHaveBeenCalledTimes(1); // throttled — no extra calls within window
    });

    it("fires trailing call after throttle window expires", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, immediate: true })
      );

      expect(effect).toHaveBeenCalledTimes(1); // leading

      act(() => {
        count$.set(1);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(effect).toHaveBeenCalledTimes(2); // trailing fires
    });

    it("uses default 200ms interval when ms not provided", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObserveThrottled(() => count$.get(), effect));

      act(() => {
        count$.set(1);
      });
      expect(effect).toHaveBeenCalledTimes(1); // leading

      act(() => {
        count$.set(2);
      });
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(effect).toHaveBeenCalledTimes(1); // trailing not yet fired

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(effect).toHaveBeenCalledTimes(2); // trailing fires at 200ms
    });
  });

  describe("options", () => {
    it("edges: ['leading'] — fires only on leading, not trailing", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, edges: ["leading"] })
      );

      act(() => {
        count$.set(1);
      });
      expect(effect).toHaveBeenCalledTimes(1); // leading

      act(() => {
        count$.set(2);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(effect).toHaveBeenCalledTimes(1); // no trailing call
    });

    it("edges: ['trailing'] — does not fire immediately on observable change", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, edges: ["trailing"] })
      );

      act(() => {
        count$.set(1);
      });
      expect(effect).toHaveBeenCalledTimes(0); // no leading

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(effect).toHaveBeenCalledTimes(1); // trailing fires
    });

    it("immediate: false — does not fire on mount, fires on observable change", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300, immediate: false })
      );
      expect(effect).not.toHaveBeenCalled();

      act(() => {
        count$.set(1);
      });
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });
  });

  describe("latest closure", () => {
    it("uses the latest effect reference when throttle trailing fires", () => {
      const calls: string[] = [];
      const count$ = observable(0);

      const { rerender } = renderHook(
        ({ label }) =>
          useObserveThrottled(
            () => count$.get(),
            (value) => {
              calls.push(`${label}:${value}`);
            },
            { ms: 300, immediate: true }
          ),
        { initialProps: { label: "initial" } }
      );

      expect(calls).toEqual(["initial:0"]); // leading fires with "initial"

      act(() => {
        count$.set(1);
      });

      rerender({ label: "updated" });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(calls[calls.length - 1]).toMatch(/^updated:/);
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw when throttle fires after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { unmount } = renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: 300 })
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
