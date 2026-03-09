// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fireMouseMove(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
  });
}

function createTouchEvent(type: string, touches: Array<Partial<Touch>> = []) {
  const event = new Event(type, { bubbles: true }) as Event & { touches: Partial<Touch>[] };
  Object.defineProperty(event, "touches", { value: touches });
  return event;
}

// ---------------------------------------------------------------------------
// useMouse — rerender stability
// ---------------------------------------------------------------------------

describe("useMouse() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not re-register event listeners on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouse();
        },
        { initialProps: { count: 0 } }
      );

      // Capture call count after initial mount
      const addCountAfterMount = addSpy.mock.calls.length;

      // Re-render with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });

      // No new addEventListener calls should have been made
      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("x$/y$ values persist through re-render", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouse({ type: "client" });
        },
        { initialProps: { count: 0 } }
      );

      // Move mouse before re-render
      fireMouseMove(120, 80);
      expect(result.current.x$.get()).toBe(120);
      expect(result.current.y$.get()).toBe(80);

      // Trigger re-render
      rerender({ count: 1 });

      // Values must persist after re-render
      expect(result.current.x$.get()).toBe(120);
      expect(result.current.y$.get()).toBe(80);

      // Mouse moves after re-render must still update correctly
      fireMouseMove(200, 150);
      expect(result.current.x$.get()).toBe(200);
      expect(result.current.y$.get()).toBe(150);
    });

    it("sourceType$ persists through re-render", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouse();
        },
        { initialProps: { count: 0 } }
      );

      // Trigger a mousemove to set sourceType$ to "mouse"
      fireMouseMove(50, 50);
      expect(result.current.sourceType$.get()).toBe("mouse");

      // Trigger re-render
      rerender({ count: 1 });

      // sourceType$ must remain "mouse" after re-render
      expect(result.current.sourceType$.get()).toBe("mouse");

      // Touch event after re-render must still update sourceType$
      act(() => {
        window.dispatchEvent(
          createTouchEvent("touchmove", [
            { pageX: 30, pageY: 40, clientX: 30, clientY: 40, screenX: 30, screenY: 40 },
          ])
        );
      });
      expect(result.current.sourceType$.get()).toBe("touch");
    });
  });
});
