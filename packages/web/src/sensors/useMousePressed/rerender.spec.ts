// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMousePressed } from ".";

// Helpers
function firePointerDown(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
  });
}

function firePointerUp(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
  });
}

describe("useMousePressed() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register event listeners on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMousePressed();
        },
        { initialProps: { count: 0 } }
      );
      const addCountAfterMount = addSpy.mock.calls.length;
      rerender({ count: 1 });
      rerender({ count: 2 });
      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("pressed$ persists through re-render while pressed", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMousePressed();
        },
        { initialProps: { count: 0 } }
      );
      firePointerDown();
      expect(result.current.pressed$.get()).toBe(true);
      rerender({ count: 1 });
      expect(result.current.pressed$.get()).toBe(true);
      firePointerUp();
      expect(result.current.pressed$.get()).toBe(false);
    });

    it("sourceType$ persists through re-render", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMousePressed();
        },
        { initialProps: { count: 0 } }
      );
      firePointerDown();
      expect(result.current.sourceType$.get()).toBe("mouse");
      rerender({ count: 1 });
      expect(result.current.sourceType$.get()).toBe("mouse");
    });
  });

  describe("callback freshness", () => {
    it("callback uses latest closure after re-render", () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const { rerender } = renderHook(
        (props: { onPressed: () => void }) => useMousePressed({ onPressed: props.onPressed }),
        { initialProps: { onPressed: cb1 } }
      );
      rerender({ onPressed: cb2 });
      firePointerDown();
      // The hook accesses callbacks via opts$.peek()?.onPressed,
      // which reads latest value from the observable
      expect(cb2).toHaveBeenCalled();
    });
  });
});
