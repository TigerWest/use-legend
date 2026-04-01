// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useObserveIgnorable } from ".";

describe("useObserveIgnorable()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const effect = vi.fn();
      renderHook(() => useObserveIgnorable(() => 0, effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect on mount", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      renderHook(() => useObserveIgnorable(() => count$.get(), effect, { immediate: true }));
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });
  });

  describe("reactive updates", () => {
    it("calls effect when observed observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      renderHook(() => useObserveIgnorable(() => count$.get(), effect));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });
  });

  describe("initial state", () => {
    it("isIgnoring$ is false by default", () => {
      const { result } = renderHook(() => useObserveIgnorable(() => 0, vi.fn()));
      expect(result.current.isIgnoring$.get()).toBe(false);
    });
  });

  describe("ignoreUpdates", () => {
    it("suppresses effect when source changes inside ignoreUpdates", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveIgnorable(() => count$.get(), effect));

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
      const { result } = renderHook(() => useObserveIgnorable(() => count$.get(), effect));

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

    it("isIgnoring$ is false after ignoreUpdates completes", () => {
      const count$ = observable(0);
      const { result } = renderHook(() => useObserveIgnorable(() => count$.get(), vi.fn()));

      act(() => {
        result.current.ignoreUpdates(() => {
          count$.set(1);
        });
      });

      expect(result.current.isIgnoring$.get()).toBe(false);
    });

    it("multiple sequential ignoreUpdates calls each suppress their own effect", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveIgnorable(() => count$.get(), effect));

      act(() => {
        result.current.ignoreUpdates(() => count$.set(1));
      });
      act(() => {
        result.current.ignoreUpdates(() => count$.set(2));
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("effect fires normally between ignoreUpdates calls", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObserveIgnorable(() => count$.get(), effect));

      act(() => {
        result.current.ignoreUpdates(() => count$.set(1));
      });
      act(() => {
        count$.set(2); // normal update — should fire
      });
      act(() => {
        result.current.ignoreUpdates(() => count$.set(3));
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(2);
    });
  });

  describe("unmount cleanup", () => {
    it("stops calling effect after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { unmount } = renderHook(() => useObserveIgnorable(() => count$.get(), effect));

      unmount();

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });
});
