// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useObserveTriggerable } from ".";

describe("useObserveTriggerable()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const effect = vi.fn();
      renderHook(() => useObserveTriggerable(() => 0, effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect on mount", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      renderHook(() => useObserveTriggerable(() => count$.get(), effect, { immediate: true }));
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });
  });

  describe("reactive updates", () => {
    it("calls effect when observed observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });
  });

  describe("trigger", () => {
    it("calls effect immediately with current selector value", () => {
      const count$ = observable(42);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.trigger();
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(42);
    });

    it("uses the latest selector value at time of trigger", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        count$.set(10);
      });

      effect.mockClear();

      act(() => {
        result.current.trigger();
      });

      expect(effect).toHaveBeenCalledWith(10);
    });

    it("does not cause reactive re-trigger after trigger()", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.trigger();
      });

      // Only the manual trigger call — no extra reactive firing
      expect(effect).toHaveBeenCalledTimes(1);
    });

    it("trigger() can be called multiple times", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.trigger();
        result.current.trigger();
        result.current.trigger();
      });

      expect(effect).toHaveBeenCalledTimes(3);
    });

    it("reactive update still fires after trigger()", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.trigger();
      });
      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(2);
      expect(effect).toHaveBeenLastCalledWith(1);
    });
  });

  describe("ignoreUpdates", () => {
    it("suppresses effect when source changes inside ignoreUpdates", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.ignoreUpdates(() => {
          count$.set(1);
        });
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("allows effect to fire normally after ignoreUpdates completes", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      act(() => {
        result.current.ignoreUpdates(() => {
          count$.set(1);
        });
      });
      act(() => {
        count$.set(2);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(2);
    });
  });

  describe("unmount cleanup", () => {
    it("stops calling effect after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { unmount } = renderHook(() => useObserveTriggerable(() => count$.get(), effect));

      unmount();

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("trigger() after unmount does not throw", () => {
      const count$ = observable(0);
      const { result, unmount } = renderHook(() =>
        useObserveTriggerable(() => count$.get(), vi.fn())
      );

      unmount();

      expect(() => result.current.trigger()).not.toThrow();
    });
  });
});
