// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useElementByPoint } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useElementByPoint()", () => {
  let rafCallbacks: Array<FrameRequestCallback>;
  let rafId: number;
  let elementFromPointMock: ReturnType<typeof vi.fn>;
  let elementsFromPointMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    // jsdom doesn't define elementFromPoint/elementsFromPoint
    elementFromPointMock = vi.fn(() => null);
    elementsFromPointMock = vi.fn(() => []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).elementFromPoint = elementFromPointMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).elementsFromPoint = elementsFromPointMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).elementFromPoint;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).elementsFromPoint;
  });

  function flushRaf() {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach((cb) => cb(performance.now()));
  }

  describe("return shape", () => {
    it("returns observable fields and pausable controls", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.element$.get).toBe("function");
      expect(typeof result.current.isActive$.get).toBe("function");
      expect(typeof result.current.pause).toBe("function");
      expect(typeof result.current.resume).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when elementFromPoint exists", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("element$ is null initially in single mode", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
      expect(result.current.element$.get()).toBeNull();
    });

    it("element$ is empty array initially in multiple mode", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0, multiple: true }));
      expect(result.current.element$.get()).toEqual([]);
    });

    it("isActive$ is true initially", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
      expect(result.current.isActive$.get()).toBe(true);
    });
  });

  describe("element detection", () => {
    it("calls elementFromPoint on RAF tick", () => {
      const mockEl = document.createElement("div");
      elementFromPointMock.mockReturnValue(mockEl);

      const { result } = renderHook(() => useElementByPoint({ x: 100, y: 200 }));

      act(() => flushRaf());

      expect(elementFromPointMock).toHaveBeenCalledWith(100, 200);
      expect(result.current.element$.get()).toBe(mockEl);
    });

    it("calls elementsFromPoint in multiple mode", () => {
      const mockEls = [document.createElement("div"), document.createElement("span")];
      elementsFromPointMock.mockReturnValue(mockEls);

      const { result } = renderHook(() => useElementByPoint({ x: 50, y: 75, multiple: true }));

      act(() => flushRaf());

      expect(elementsFromPointMock).toHaveBeenCalledWith(50, 75);
      expect(result.current.element$.get()).toEqual(mockEls);
    });

    it("supports reactive x and y values", () => {
      renderHook(() => useElementByPoint({ x: 10, y: 20 }));

      act(() => flushRaf());

      expect(elementFromPointMock).toHaveBeenCalledWith(10, 20);
    });
  });

  describe("pausable controls", () => {
    it("pause() stops updating element$", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("span");
      elementFromPointMock.mockReturnValue(el1);

      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      act(() => flushRaf());
      expect(result.current.element$.get()).toBe(el1);

      act(() => result.current.pause());
      elementFromPointMock.mockReturnValue(el2);
      act(() => flushRaf());

      expect(result.current.element$.get()).toBe(el1);
    });

    it("resume() restarts updating", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("span");
      elementFromPointMock.mockReturnValue(el1);

      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      act(() => flushRaf());
      act(() => result.current.pause());
      elementFromPointMock.mockReturnValue(el2);
      act(() => result.current.resume());
      act(() => flushRaf());

      expect(result.current.element$.get()).toBe(el2);
    });

    it("isActive$ reflects pause/resume state", () => {
      const { result } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      expect(result.current.isActive$.get()).toBe(true);
      act(() => result.current.pause());
      expect(result.current.isActive$.get()).toBe(false);
      act(() => result.current.resume());
      expect(result.current.isActive$.get()).toBe(true);
    });
  });

  describe("unmount cleanup", () => {
    it("cancels RAF on unmount", async () => {
      const { unmount } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

      unmount();
      await flush();

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
