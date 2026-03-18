// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useElementByPoint } from ".";

describe("useElementByPoint() — rerender stability", () => {
  let rafCallbacks: Array<FrameRequestCallback>;
  let rafId: number;
  let elementFromPointMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    elementFromPointMock = vi.fn(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).elementFromPoint = elementFromPointMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).elementsFromPoint = vi.fn(() => []);
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

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.element$).toBe(first.element$);
    expect(result.current.isActive$).toBe(first.isActive$);
  });

  it("pause/resume function references are stable", () => {
    const { result, rerender } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
    const firstPause = result.current.pause;
    const firstResume = result.current.resume;
    rerender();
    expect(result.current.pause).toBe(firstPause);
    expect(result.current.resume).toBe(firstResume);
  });

  it("element$ value persists across re-renders", () => {
    const mockEl = document.createElement("div");
    elementFromPointMock.mockReturnValue(mockEl);

    const { result, rerender } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));

    act(() => flushRaf());
    expect(result.current.element$.get()).toBe(mockEl);
    rerender();
    expect(result.current.element$.get()).toBe(mockEl);
  });

  it("does not restart RAF loop on re-render", () => {
    const { rerender } = renderHook(() => useElementByPoint({ x: 0, y: 0 }));
    const callsAfterMount = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls
      .length;
    rerender();
    rerender();
    expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      callsAfterMount
    );
  });
});
