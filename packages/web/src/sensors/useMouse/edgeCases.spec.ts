// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTouchEvent(type: string, touches: Array<Partial<Touch>> = []) {
  const event = new Event(type, { bubbles: true }) as Event & { touches: Partial<Touch>[] };
  Object.defineProperty(event, "touches", { value: touches });
  return event;
}

// ---------------------------------------------------------------------------
// useMouse — edge cases
// ---------------------------------------------------------------------------

describe("useMouse() — edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("handles touchmove with zero touches", () => {
    const { result } = renderHook(() => useMouse({ type: "client" }));

    // Set a baseline by firing a mousemove first
    act(() => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 50, clientY: 60, bubbles: true })
      );
    });
    expect(result.current.x$.get()).toBe(50);
    expect(result.current.y$.get()).toBe(60);

    // Fire touchmove with zero touches — hook must guard against e.touches[0] being undefined
    expect(() => {
      act(() => {
        window.dispatchEvent(createTouchEvent("touchmove", []));
      });
    }).not.toThrow();

    // Coordinates must remain unchanged (guard: if touches.length === 0 → return early)
    expect(result.current.x$.get()).toBe(50);
    expect(result.current.y$.get()).toBe(60);
  });

  it("movement type with touch event returns 0,0", () => {
    const { result } = renderHook(() => useMouse({ type: "movement" }));

    // Touch events don't have movementX/Y — hook must return 0, 0
    act(() => {
      window.dispatchEvent(
        createTouchEvent("touchmove", [
          { pageX: 100, pageY: 200, clientX: 100, clientY: 200, screenX: 100, screenY: 200 },
        ])
      );
    });

    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
    expect(result.current.sourceType$.get()).toBe("touch");
  });

  it("rapid mousemove events do not cause issues", () => {
    const { result } = renderHook(() => useMouse({ type: "client" }));

    // Fire many events in rapid succession
    act(() => {
      for (let i = 0; i < 100; i++) {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: i * 3, clientY: i * 2, bubbles: true })
        );
      }
    });

    // Last event values should be reflected
    expect(result.current.x$.get()).toBe(99 * 3);
    expect(result.current.y$.get()).toBe(99 * 2);
    expect(result.current.sourceType$.get()).toBe("mouse");
  });

  it("handles null target gracefully", () => {
    // Passing target: null should not throw and still attach to window (or be a no-op)
    expect(() => {
      const { result } = renderHook(() => useMouse({ target: null as any }));

      // With null target, hook may attach to window or be a no-op.
      // Either way observable values should be accessible without error.
      expect(result.current.x$.get()).toBeDefined();
      expect(result.current.y$.get()).toBeDefined();
      expect(result.current.sourceType$.get()).toBeNull();
    }).not.toThrow();
  });
});
