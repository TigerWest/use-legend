// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { usePointer } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("usePointer()", () => {
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

  describe("return shape", () => {
    it("returns observable fields and isInside", () => {
      const { result } = renderHook(() => usePointer());
      expect(typeof result.current.x$.get).toBe("function");
      expect(typeof result.current.y$.get).toBe("function");
      expect(typeof result.current.pressure$.get).toBe("function");
      expect(typeof result.current.pointerId$.get).toBe("function");
      expect(typeof result.current.tiltX$.get).toBe("function");
      expect(typeof result.current.tiltY$.get).toBe("function");
      expect(typeof result.current.width$.get).toBe("function");
      expect(typeof result.current.height$.get).toBe("function");
      expect(typeof result.current.twist$.get).toBe("function");
      expect(typeof result.current.pointerType$.get).toBe("function");
      expect(typeof result.current.isInside$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("starts with default values", () => {
      const { result } = renderHook(() => usePointer());
      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
      expect(result.current.pressure$.get()).toBe(0);
      expect(result.current.pointerId$.get()).toBe(0);
      expect(result.current.tiltX$.get()).toBe(0);
      expect(result.current.tiltY$.get()).toBe(0);
      expect(result.current.width$.get()).toBe(1);
      expect(result.current.height$.get()).toBe(1);
      expect(result.current.twist$.get()).toBe(0);
      expect(result.current.pointerType$.get()).toBeNull();
      expect(result.current.isInside$.get()).toBe(false);
    });
  });

  describe("pointer tracking", () => {
    it("updates on pointermove", () => {
      const { result } = renderHook(() => usePointer());

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: 100,
            clientY: 200,
            pressure: 0.5,
            pointerId: 1,
            tiltX: 10,
            tiltY: 20,
            width: 3,
            height: 4,
            twist: 45,
            pointerType: "pen",
          })
        );
      });

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
      expect(result.current.pressure$.get()).toBe(0.5);
      expect(result.current.pointerId$.get()).toBe(1);
      expect(result.current.tiltX$.get()).toBe(10);
      expect(result.current.tiltY$.get()).toBe(20);
      expect(result.current.width$.get()).toBe(3);
      expect(result.current.height$.get()).toBe(4);
      expect(result.current.twist$.get()).toBe(45);
      expect(result.current.pointerType$.get()).toBe("pen");
    });

    it("updates on pointerdown", () => {
      const { result } = renderHook(() => usePointer());

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointerdown", {
            clientX: 50,
            clientY: 75,
            pointerType: "touch",
          })
        );
      });

      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(75);
      expect(result.current.pointerType$.get()).toBe("touch");
    });

    it("updates on pointerup", () => {
      const { result } = renderHook(() => usePointer());

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointerup", {
            clientX: 30,
            clientY: 40,
          })
        );
      });

      expect(result.current.x$.get()).toBe(30);
      expect(result.current.y$.get()).toBe(40);
    });
  });

  describe("isInside tracking", () => {
    it("sets isInside to true on pointer events", () => {
      const { result } = renderHook(() => usePointer());

      act(() => {
        window.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 20 }));
      });

      expect(result.current.isInside$.get()).toBe(true);
    });

    it("sets isInside to false on pointerleave", () => {
      const { result } = renderHook(() => usePointer());

      act(() => {
        window.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 20 }));
      });
      expect(result.current.isInside$.get()).toBe(true);

      act(() => {
        window.dispatchEvent(new PointerEvent("pointerleave"));
      });
      expect(result.current.isInside$.get()).toBe(false);
    });
  });

  describe("pointerTypes filter", () => {
    it("ignores events from unmatched pointer types", () => {
      const { result } = renderHook(() => usePointer({ pointerTypes: ["pen"] }));

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: 100,
            clientY: 200,
            pointerType: "mouse",
          })
        );
      });

      // isInside still sets to true (before filter check)
      expect(result.current.isInside$.get()).toBe(true);
      // But coordinates should NOT update
      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
    });

    it("accepts events from matched pointer types", () => {
      const { result } = renderHook(() => usePointer({ pointerTypes: ["pen", "touch"] }));

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: 100,
            clientY: 200,
            pointerType: "pen",
          })
        );
      });

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => usePointer());
      unmount();
      await flush();

      const events = ["pointerdown", "pointermove", "pointerup", "pointerleave"];
      for (const evt of events) {
        expect(addSpy.mock.calls.some(([t]) => t === evt)).toBe(true);
        expect(removeSpy.mock.calls.some(([t]) => t === evt)).toBe(true);
      }
    });
  });
});
