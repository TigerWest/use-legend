// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMousePressed } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POINTER_EVENTS = ["pointerdown"] as const;
const TOUCH_TARGET_EVENTS = ["touchstart"] as const;
const ALL_TARGET_EVENTS = [...POINTER_EVENTS, ...TOUCH_TARGET_EVENTS];

function countEventCalls(spy: ReturnType<typeof vi.spyOn>, eventNames: readonly string[]) {
  return spy.mock.calls.filter(([type]: [unknown]) => eventNames.includes(type as string)).length;
}

// ---------------------------------------------------------------------------
// useMousePressed — element lifecycle
// ---------------------------------------------------------------------------

describe("useMousePressed() — element lifecycle", () => {
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
    it("Ref$ null → element: pointerdown listener is registered", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => result.current.el$(el));

      expect(addSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);
    });

    it("Ref$ null → element: touch listeners are registered when touch=true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => result.current.el$(el));

      for (const event of TOUCH_TARGET_EVENTS) {
        expect(addSpy.mock.calls.some(([type]) => type === event)).toBe(true);
      }
    });

    it("Ref$ element → null: pointerdown listener is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);
    });

    it("Ref$ element → null: touch listeners are removed when touch=true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      for (const event of TOUCH_TARGET_EVENTS) {
        expect(removeSpy.mock.calls.some(([type]) => type === event)).toBe(true);
      }
    });

    it("addEventListener/removeEventListener call counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
      });

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      const addCount = countEventCalls(addSpy, ALL_TARGET_EVENTS);
      const removeCount = countEventCalls(removeSpy, ALL_TARGET_EVENTS);

      expect(addCount).toBe(removeCount);
    });

    it("events on old element are not reported after target change", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Press on element
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(true);

      // Release via window
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(false);

      // Remove element
      act(() => result.current.el$(null));

      // Events on old element should not update pressed$
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(false);
    });

    // --- Functional after mount ---

    it("dispatched pointerdown updates pressed$ after Ref$ element mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });

      expect(result.current.mp.pressed$.get()).toBe(true);
      expect(result.current.mp.sourceType$.get()).toBe("mouse");
    });

    // --- Functional after re-mount ---

    it("dispatched pointerdown updates pressed$ after null → element → null → element", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");

      // Mount
      act(() => result.current.el$(el));
      // Unmount
      act(() => result.current.el$(null));
      // Re-mount
      act(() => result.current.el$(el));

      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });

      expect(result.current.mp.pressed$.get()).toBe(true);
      expect(result.current.mp.sourceType$.get()).toBe("mouse");
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable target null → element: pointerdown listener is registered", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      renderHook(() => useMousePressed({ target: target$ as any }));

      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);
    });

    it("Observable target element → null: pointerdown listener is removed", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      renderHook(() => useMousePressed({ target: target$ as any }));

      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => target$.set(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);
    });

    it("Observable target element → null → element: listener re-registered", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      renderHook(() => useMousePressed({ target: target$ as any }));

      // Remove element
      act(() => target$.set(null));

      // Re-add element
      const addSpy = vi.spyOn(el, "addEventListener");
      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);
    });

    // --- Functional after mount ---

    it("dispatched pointerdown updates pressed$ after Observable element mount", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useMousePressed({ target: target$ as any }));

      const el = document.createElement("div");
      act(() => target$.set(ObservableHint.opaque(el)));

      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });

      expect(result.current.pressed$.get()).toBe(true);
      expect(result.current.sourceType$.get()).toBe("mouse");
    });

    // --- Functional after re-mount ---

    it("dispatched pointerdown updates pressed$ after Observable null → element → null → element", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useMousePressed({ target: target$ as any }));

      // Set element, then remove, then re-set
      act(() => target$.set(ObservableHint.opaque(el)));
      act(() => target$.set(null));
      act(() => target$.set(ObservableHint.opaque(el)));

      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });

      expect(result.current.pressed$.get()).toBe(true);
      expect(result.current.sourceType$.get()).toBe("mouse");
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
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
      const addCount = countEventCalls(addSpy, ALL_TARGET_EVENTS);
      const removeCount = countEventCalls(removeSpy, ALL_TARGET_EVENTS);

      expect(addCount).toBe(removeCount);
    });

    it("pressed$ resets when element is removed while pressed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Press down on element
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(true);

      // Spy on removeEventListener to confirm listener is cleaned up
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // Remove element
      act(() => result.current.el$(null));

      // pointerdown listener on the old element must be removed
      expect(removeSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);

      // Events on old element no longer update pressed$
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      // pressed$ should not change due to the old element's event
      // (still true from the previous press, not re-triggered)
      // pointerup on window should still release
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // pressed during element removal
  // -------------------------------------------------------------------------

  describe("pressed during element removal", () => {
    it("pressed$=true → element removed → pointerdown listener removed from old element", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      const el = document.createElement("div");
      act(() => result.current.el$(el));

      // Press down
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(true);

      // Remove element while still pressed
      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      // Listener must be removed
      expect(removeSpy.mock.calls.some(([type]) => type === "pointerdown")).toBe(true);

      // Future pointerdowns on the old element must not update state
      act(() => {
        el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      });
      // pressed$ should still be true (from before) — not falsely re-triggered
      // The window pointerup listener is still active and should still release
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      });
      expect(result.current.mp.pressed$.get()).toBe(false);
    });
  });
});
