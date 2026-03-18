// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { observable } from "@legendapp/state";
import { useElementByPoint } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useElementByPoint() — lifecycle", () => {
  let rafCallbacks: FrameRequestCallback[];
  let rafIdCounter: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafIdCounter = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafIdCounter;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    // jsdom doesn't define elementFromPoint — stub it
    if (!document.elementFromPoint) {
      (document as any).elementFromPoint = () => null;
    }
  });

  function runRAF() {
    const cbs = rafCallbacks.splice(0);
    cbs.forEach((cb) => cb(performance.now()));
  }

  describe("mount and unmount", () => {
    it("starts RAF loop on mount", () => {
      renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      // RAF should have been requested on mount
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it("continues RAF loop across ticks", () => {
      renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      const initialCallCount = (window.requestAnimationFrame as any).mock.calls.length;

      // Run a tick — the loop should schedule the next frame
      act(() => runRAF());

      expect((window.requestAnimationFrame as any).mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });

    it("polls elementFromPoint each RAF tick", () => {
      const mockEl = document.createElement("div");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      const { result } = renderHook(() => useElementByPoint({ x: 100, y: 200 }));

      // Run RAF tick
      act(() => runRAF());

      expect(document.elementFromPoint).toHaveBeenCalledWith(100, 200);
      expect(result.current.element$.get()).toBe(mockEl);
    });
  });

  describe("reactive options", () => {
    it("responds to observable x/y changes", () => {
      const x$ = observable(10);
      const y$ = observable(20);
      const mockEl1 = document.createElement("div");
      const mockEl2 = document.createElement("span");

      vi.spyOn(document, "elementFromPoint").mockImplementation((x, y) => {
        if (x === 10 && y === 20) return mockEl1;
        if (x === 50 && y === 60) return mockEl2;
        return null;
      });

      const { result } = renderHook(() => useElementByPoint({ x: x$, y: y$ }));

      act(() => runRAF());
      expect(result.current.element$.get()).toBe(mockEl1);

      // Change x/y
      act(() => {
        x$.set(50);
        y$.set(60);
      });

      act(() => runRAF());
      expect(result.current.element$.get()).toBe(mockEl2);
    });
  });

  describe("pause and resume", () => {
    it("pause stops polling, resume restarts", () => {
      const mockEl = document.createElement("div");
      const mockEl2 = document.createElement("span");
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl);

      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      act(() => runRAF());
      expect(result.current.element$.get()).toBe(mockEl);
      expect(result.current.isActive$.get()).toBe(true);

      // Pause
      act(() => result.current.pause());
      expect(result.current.isActive$.get()).toBe(false);

      // Change element — should not update while paused
      vi.spyOn(document, "elementFromPoint").mockReturnValue(mockEl2);
      act(() => runRAF());
      expect(result.current.element$.get()).toBe(mockEl);

      // Resume
      act(() => result.current.resume());
      expect(result.current.isActive$.get()).toBe(true);

      act(() => runRAF());
      expect(result.current.element$.get()).toBe(mockEl2);
    });
  });
});
