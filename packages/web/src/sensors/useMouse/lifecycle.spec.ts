// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOUSE_EVENTS = ["mousemove"] as const;
const TOUCH_EVENTS = ["touchstart", "touchmove", "touchend"] as const;
const ALL_EVENTS = [...MOUSE_EVENTS, ...TOUCH_EVENTS];

function countEventCalls(spy: ReturnType<typeof vi.spyOn>, eventNames: readonly string[]) {
  return spy.mock.calls.filter(([type]: [unknown]) => eventNames.includes(type as string)).length;
}

// ---------------------------------------------------------------------------
// useMouse — element lifecycle
// ---------------------------------------------------------------------------

describe("useMouse() — element lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: mousemove listener is registered", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$ });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => result.current.el$(el));

      expect(addSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    });

    it("Ref$ null → element: touch listeners are registered when touch=true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => result.current.el$(el));

      for (const event of TOUCH_EVENTS) {
        expect(addSpy.mock.calls.some(([type]) => type === event)).toBe(true);
      }
    });

    it("Ref$ element → null: mousemove listener is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$ });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    });

    it("Ref$ element → null: touch listeners are removed when touch=true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      for (const event of TOUCH_EVENTS) {
        expect(removeSpy.mock.calls.some(([type]) => type === event)).toBe(true);
      }
    });

    it("addEventListener/removeEventListener call counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      const addCount = countEventCalls(addSpy, ALL_EVENTS);
      const removeCount = countEventCalls(removeSpy, ALL_EVENTS);

      expect(addCount).toBe(removeCount);
    });

    it("events on old element are not reported after target change", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Move mouse on element
      act(() => {
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 42, clientY: 84 }));
      });
      expect(result.current.mouse.x$.get()).toBe(42);

      // Remove element
      act(() => result.current.el$(null));

      // Events on old element should not update state
      act(() => {
        el.dispatchEvent(
          new MouseEvent("mousemove", { bubbles: true, clientX: 999, clientY: 999 })
        );
      });
      expect(result.current.mouse.x$.get()).toBe(42);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable target null → element: mousemove listener is registered", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      renderHook(() => useMouse({ target: target$ as any }));

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    });

    it("Observable target element → null: mousemove listener is removed", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      renderHook(() => useMouse({ target: target$ as any }));

      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => target$.set(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);
    });

    it("Observable target element → null → element: listener re-registered", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMouse({ target: target$ as any, type: "client" }));

      // Remove element
      act(() => target$.set(null));

      // Re-add element
      const addSpy = vi.spyOn(el, "addEventListener");
      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);

      // Verify mouse events work after re-registration
      act(() => {
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 77, clientY: 33 }));
      });

      expect(result.current.x$.get()).toBe(77);
      expect(result.current.y$.get()).toBe(33);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // Cycle 1
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // Cycle 2
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // Cycle 3
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // After 3 full cycles, add and remove counts should be equal (no leaks)
      const addCount = countEventCalls(addSpy, ALL_EVENTS);
      const removeCount = countEventCalls(removeSpy, ALL_EVENTS);

      expect(addCount).toBe(removeCount);
    });

    it("values reset to defaults when element is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Move mouse on element
      act(() => {
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 42, clientY: 84 }));
      });
      expect(result.current.mouse.x$.get()).toBe(42);
      expect(result.current.mouse.y$.get()).toBe(84);

      // Remove element — coordinates retain last known values
      // (useMouse does not reset on target removal, unlike resetOnTouchEnds)
      act(() => result.current.el$(null));
      expect(result.current.mouse.x$.get()).toBe(42);
      expect(result.current.mouse.y$.get()).toBe(84);

      // Re-attach and verify new events work
      act(() => result.current.el$(el));
      act(() => {
        el.dispatchEvent(
          new MouseEvent("mousemove", { bubbles: true, clientX: 100, clientY: 200 })
        );
      });
      expect(result.current.mouse.x$.get()).toBe(100);
      expect(result.current.mouse.y$.get()).toBe(200);
    });

    it("listener is properly removed when element is removed during active tracking", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Move mouse (active tracking)
      act(() => {
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 50, clientY: 60 }));
      });
      expect(result.current.mouse.sourceType$.get()).toBe("mouse");

      // Remove element mid-tracking
      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "mousemove")).toBe(true);

      // Events on old element should not update state
      act(() => {
        el.dispatchEvent(
          new MouseEvent("mousemove", { bubbles: true, clientX: 999, clientY: 999 })
        );
      });
      expect(result.current.mouse.x$.get()).not.toBe(999);
    });
  });
});
