// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
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

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

/** Fire pointerdown then click on an element (outside pattern). */
function fireOutsideClick(el: Element) {
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  el.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
}

// ---------------------------------------------------------------------------
// useOnClickOutside tests
// ---------------------------------------------------------------------------

describe("useOnClickOutside()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // -------------------------------------------------------------------------
  // return type
  // -------------------------------------------------------------------------

  describe("return type", () => {
    it("returns a stop function", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      const { result } = renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      expect(typeof result.current).toBe("function");
    });

    it("stop() removes all listeners — handler no longer fires", () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("div");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const handler = vi.fn();

      const { result } = renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      // stop all listeners
      act(() => {
        result.current();
      });

      // click outside should NOT fire handler after stop
      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // core behavior
  // -------------------------------------------------------------------------

  describe("core behavior", () => {
    it("click outside target calls handler", () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const handler = vi.fn();

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("click inside target does NOT call handler", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      act(() => {
        targetEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
        targetEl.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("click on child of target does NOT call handler", () => {
      const targetEl = document.createElement("div");
      const childEl = document.createElement("span");
      targetEl.appendChild(childEl);
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      act(() => {
        childEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
        childEl.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // options
  // -------------------------------------------------------------------------

  describe("options", () => {
    it("ignore option with CSS selector — clicking ignored element does NOT call handler", () => {
      const targetEl = document.createElement("div");
      const ignoredEl = document.createElement("button");
      ignoredEl.className = "ignored-btn";
      document.body.appendChild(targetEl);
      document.body.appendChild(ignoredEl);
      const handler = vi.fn();

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler, { ignore: [".ignored-btn"] }));

      act(() => {
        fireOutsideClick(ignoredEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("ignore option with MaybeElement — clicking ignored element does NOT call handler", () => {
      const targetEl = document.createElement("div");
      const ignoredEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(ignoredEl);
      const handler = vi.fn();
      const ignored$ = wrapEl(ignoredEl);

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler, { ignore: [ignored$] }));

      act(() => {
        fireOutsideClick(ignoredEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("capture: false option works without errors", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      expect(() => {
        renderHook(() => useOnClickOutside(wrapEl(targetEl), handler, { capture: false }));
      }).not.toThrow();
    });

    it("detectIframe: true — handler fires when focus moves to iframe", () => {
      vi.useFakeTimers();
      const targetEl = document.createElement("div");
      const iframe = document.createElement("iframe");
      document.body.appendChild(targetEl);
      document.body.appendChild(iframe);
      const handler = vi.fn();

      renderHook(() => useOnClickOutside(wrapEl(targetEl), handler, { detectIframe: true }));

      Object.defineProperty(document, "activeElement", {
        value: iframe,
        configurable: true,
      });

      act(() => {
        window.dispatchEvent(new FocusEvent("blur", { bubbles: false }));
        vi.advanceTimersByTime(1);
      });

      expect(handler).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // null target guard
  // -------------------------------------------------------------------------

  describe("null target guard", () => {
    it("does not throw when target is null", () => {
      const handler = vi.fn();

      expect(() => {
        const { unmount } = renderHook(() => useOnClickOutside(null, handler));
        act(() => {
          document.body.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, composed: true })
          );
          document.body.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
        });
        unmount();
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("does not throw on unmount", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      const { unmount } = renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      expect(() => unmount()).not.toThrow();
    });

    it("handler not called after unmount", async () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const handler = vi.fn();

      const { unmount } = renderHook(() => useOnClickOutside(wrapEl(targetEl), handler));

      unmount();
      await Promise.resolve();

      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // controls mode
  // -------------------------------------------------------------------------

  describe("controls mode", () => {
    it("returns { stop, cancel, trigger } when controls: true", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useOnClickOutside(wrapEl(targetEl), handler, { controls: true })
      );

      expect(typeof result.current.stop).toBe("function");
      expect(typeof result.current.cancel).toBe("function");
      expect(typeof result.current.trigger).toBe("function");
    });

    it("stop() removes all listeners — handler no longer fires", () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("div");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useOnClickOutside(wrapEl(targetEl), handler, { controls: true })
      );

      act(() => {
        result.current.stop();
      });

      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("cancel() prevents the next outside click from triggering", () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("div");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useOnClickOutside(wrapEl(targetEl), handler, { controls: true })
      );

      act(() => {
        result.current.cancel();
      });

      act(() => {
        fireOutsideClick(outsideEl);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("trigger(event) manually invokes the handler", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const handler = vi.fn();

      const { result } = renderHook(() =>
        useOnClickOutside(wrapEl(targetEl), handler, { controls: true })
      );

      const fakeEvent = new Event("custom");
      act(() => {
        result.current.trigger(fakeEvent);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
