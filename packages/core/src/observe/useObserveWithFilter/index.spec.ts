// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bypassFilter } from "@shared/filters";
import { createPausableFilter } from "@utilities/usePausableFilter";
import { useObserveWithFilter } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useObserveWithFilter()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const effect = vi.fn();
      renderHook(() => useObserveWithFilter(() => 0, effect, { eventFilter: bypassFilter }));
      expect(effect).not.toHaveBeenCalled();
    });

    it("immediate: true — calls effect on mount", () => {
      const count$ = observable(5);
      const effect = vi.fn();
      renderHook(() =>
        useObserveWithFilter(() => count$.get(), effect, {
          eventFilter: bypassFilter,
          immediate: true,
        })
      );
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });
  });

  describe("reactive updates", () => {
    it("calls effect when an observed observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      renderHook(() =>
        useObserveWithFilter(() => count$.get(), effect, { eventFilter: bypassFilter })
      );

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });

    it("calls effect for each observable change", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      renderHook(() =>
        useObserveWithFilter(() => count$.get(), effect, { eventFilter: bypassFilter })
      );

      act(() => {
        count$.set(1);
      });
      act(() => {
        count$.set(2);
      });
      act(() => {
        count$.set(3);
      });

      expect(effect).toHaveBeenCalledTimes(3);
    });
  });

  describe("pausable (createPausableFilter)", () => {
    it("does not call effect when filter is paused", () => {
      const count$ = observable(0);
      const { pause, resume, eventFilter } = createPausableFilter();
      const effect = vi.fn();

      renderHook(() => useObserveWithFilter(() => count$.get(), effect, { eventFilter }));

      act(() => {
        pause();
      });
      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
      void resume;
    });

    it("resumes calling effect after resume()", () => {
      const count$ = observable(0);
      const { pause, resume, eventFilter } = createPausableFilter();
      const effect = vi.fn();

      renderHook(() => useObserveWithFilter(() => count$.get(), effect, { eventFilter }));

      act(() => {
        pause();
      });
      act(() => {
        resume();
      });
      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
    });

    it("maintains dep tracking after pause → source change → resume", () => {
      const count$ = observable(0);
      const { pause, resume, eventFilter } = createPausableFilter();
      const effect = vi.fn();

      renderHook(() => useObserveWithFilter(() => count$.get(), effect, { eventFilter }));

      act(() => {
        pause();
      });
      act(() => {
        count$.set(1);
      }); // selector still runs (dep tracking preserved)
      act(() => {
        resume();
      });
      act(() => {
        count$.set(2);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(2);
    });
  });

  describe("latest closure", () => {
    it("always uses the latest effect reference", () => {
      const count$ = observable(0);
      const results: number[] = [];

      const { rerender } = renderHook(
        ({ multiplier }) =>
          useObserveWithFilter(
            () => count$.get(),
            (value) => {
              results.push(value * multiplier);
            },
            { eventFilter: bypassFilter }
          ),
        { initialProps: { multiplier: 1 } }
      );

      act(() => {
        count$.set(2);
      });

      rerender({ multiplier: 3 });

      act(() => {
        count$.set(4);
      });

      expect(results).toEqual([2, 12]);
    });
  });

  describe("unmount cleanup", () => {
    it("stops calling effect after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      const { unmount } = renderHook(() =>
        useObserveWithFilter(() => count$.get(), effect, { eventFilter: bypassFilter })
      );

      unmount();

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });
});
