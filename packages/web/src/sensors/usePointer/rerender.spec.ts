// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePointer } from ".";

describe("usePointer() — rerender stability", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "PointerEvent",
      class PointerEvent extends Event {
        clientX: number;
        clientY: number;
        pressure: number;
        pointerId: number;
        tiltX: number;
        tiltY: number;
        width: number;
        height: number;
        twist: number;
        pointerType: string;
        constructor(type: string, init: any = {}) {
          super(type, { bubbles: true, ...init });
          this.clientX = init.clientX ?? 0;
          this.clientY = init.clientY ?? 0;
          this.pressure = init.pressure ?? 0;
          this.pointerId = init.pointerId ?? 0;
          this.tiltX = init.tiltX ?? 0;
          this.tiltY = init.tiltY ?? 0;
          this.width = init.width ?? 1;
          this.height = init.height ?? 1;
          this.twist = init.twist ?? 0;
          this.pointerType = init.pointerType ?? "mouse";
        }
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => usePointer());
    const first = result.current;
    rerender();
    expect(result.current.x$).toBe(first.x$);
    expect(result.current.y$).toBe(first.y$);
    expect(result.current.pressure$).toBe(first.pressure$);
    expect(result.current.pointerId$).toBe(first.pointerId$);
    expect(result.current.pointerType$).toBe(first.pointerType$);
    expect(result.current.isInside$).toBe(first.isInside$);
  });

  it("does not re-register event listeners on re-render", () => {
    const addSpy = vi.spyOn(window, "addEventListener");

    const { rerender } = renderHook(() => usePointer());
    const countAfterMount = addSpy.mock.calls.filter(
      ([type]) => typeof type === "string" && type.startsWith("pointer")
    ).length;

    rerender();
    rerender();

    const countAfterRerenders = addSpy.mock.calls.filter(
      ([type]) => typeof type === "string" && type.startsWith("pointer")
    ).length;

    expect(countAfterRerenders).toBe(countAfterMount);
  });

  it("values persist across re-renders", () => {
    const { result, rerender } = renderHook(() => usePointer());

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 42,
          clientY: 84,
          pointerType: "mouse",
        })
      );
    });

    expect(result.current.x$.get()).toBe(42);
    rerender();
    expect(result.current.x$.get()).toBe(42);
    expect(result.current.y$.get()).toBe(84);
  });
});
