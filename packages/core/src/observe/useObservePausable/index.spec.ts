// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useObservePausable } from ".";

describe("useObservePausable()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const effect = vi.fn();
      renderHook(() => useObservePausable(() => 0, effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect on mount", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      renderHook(() => useObservePausable(() => count$.get(), effect, { immediate: true }));
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });
  });

  describe("reactive updates", () => {
    it("calls effect when observed observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      renderHook(() => useObservePausable(() => count$.get(), effect));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });
  });

  describe("initial state", () => {
    it("isActive$ is true by default", () => {
      const { result } = renderHook(() => useObservePausable(() => 0, vi.fn()));
      expect(result.current.isActive$.get()).toBe(true);
    });

    it("initialState: paused — isActive$ starts false", () => {
      const { result } = renderHook(() =>
        useObservePausable(() => 0, vi.fn(), { initialState: "paused" })
      );
      expect(result.current.isActive$.get()).toBe(false);
    });

    it("initialState: paused — does not call effect on change", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useObservePausable(() => count$.get(), effect, { initialState: "paused" }));

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });

  describe("controls", () => {
    it("pause() stops effect from firing", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObservePausable(() => count$.get(), effect));

      act(() => {
        result.current.pause();
      });
      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("resume() allows effect to fire again after pause", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObservePausable(() => count$.get(), effect));

      act(() => {
        result.current.pause();
      });
      act(() => {
        result.current.resume();
      });
      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });

    it("pause() sets isActive$ to false", () => {
      const { result } = renderHook(() => useObservePausable(() => 0, vi.fn()));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive$.get()).toBe(false);
    });

    it("resume() sets isActive$ to true", () => {
      const { result } = renderHook(() =>
        useObservePausable(() => 0, vi.fn(), { initialState: "paused" })
      );

      act(() => {
        result.current.resume();
      });

      expect(result.current.isActive$.get()).toBe(true);
    });

    it("maintains dep tracking after pause → source change → resume", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      const { result } = renderHook(() => useObservePausable(() => count$.get(), effect));

      act(() => {
        result.current.pause();
      });
      act(() => {
        count$.set(1);
      }); // selector still tracks deps while paused
      act(() => {
        result.current.resume();
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
      const { unmount } = renderHook(() => useObservePausable(() => count$.get(), effect));

      unmount();

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });
});
