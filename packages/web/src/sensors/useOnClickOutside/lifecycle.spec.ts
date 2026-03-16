// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useOnClickOutside } from ".";

// ---------------------------------------------------------------------------
// jsdom PointerEvent polyfill
// ---------------------------------------------------------------------------
class PointerEventPolyfill extends MouseEvent {
  pointerType: string;
  pointerId: number;
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params as MouseEventInit);
    this.pointerType = params.pointerType ?? "mouse";
    this.pointerId = params.pointerId ?? 0;
  }
}
if (typeof window !== "undefined" && !window.PointerEvent) {
  (globalThis as any).PointerEvent = PointerEventPolyfill;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fireOutsideClick(el: Element) {
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  el.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
}

// ---------------------------------------------------------------------------
// lifecycle tests
// ---------------------------------------------------------------------------

describe("useOnClickOutside() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("null → element: handler fires on outside click after mount", () => {
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useOnClickOutside(el$, handler);
        return { el$ };
      });

      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);

      act(() => result.current.el$(targetEl));

      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("element → null: handler does NOT fire after target set to null", () => {
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useOnClickOutside(el$, handler);
        return { el$ };
      });

      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);

      // Mount, verify it works
      act(() => result.current.el$(targetEl));
      act(() => fireOutsideClick(outsideEl));
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Unmount — set Ref$ to null
      act(() => result.current.el$(null));

      act(() => {
        fireOutsideClick(outsideEl);
      });

      // Handler should not be called: target is null so composedPath check bails out
      expect(handler).not.toHaveBeenCalled();
    });

    it("full cycle (null → el → null → el2): no resource leaks, handler works after re-mount", () => {
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useOnClickOutside(el$, handler);
        return { el$ };
      });

      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(el1);
      document.body.appendChild(el2);
      document.body.appendChild(outsideEl);

      // null → el1
      act(() => result.current.el$(el1));
      // el1 → null
      act(() => result.current.el$(null));
      // null → el2
      act(() => result.current.el$(el2));

      handler.mockClear();

      // Handler fires for outside click with el2 as target
      act(() => {
        fireOutsideClick(outsideEl);
      });
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Click on el2 itself — should NOT fire handler
      act(() => {
        el2.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
        el2.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("functional verification after mount: dispatching outside click updates handler call count", () => {
      vi.useFakeTimers();
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useOnClickOutside(el$, handler);
        return { el$ };
      });

      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);

      act(() => result.current.el$(targetEl));

      // First outside click
      act(() => {
        fireOutsideClick(outsideEl);
        vi.advanceTimersByTime(0);
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Second outside click — flush the isProcessingRef setTimeout first
      act(() => {
        fireOutsideClick(outsideEl);
        vi.advanceTimersByTime(0);
      });
      expect(handler).toHaveBeenCalledTimes(2);

      // Inside click must NOT increment
      act(() => {
        targetEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
        targetEl.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
        vi.advanceTimersByTime(0);
      });
      expect(handler).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});
