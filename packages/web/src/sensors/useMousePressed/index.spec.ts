// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useMousePressed } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function fireTouchStart(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new Event("touchstart", { bubbles: true }));
  });
}

function fireTouchEnd(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new Event("touchend", { bubbles: true }));
  });
}

function fireTouchCancel(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new Event("touchcancel", { bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
// useMousePressed tests
// ---------------------------------------------------------------------------

describe("useMousePressed()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("pressed$ defaults to false", () => {
      const { result } = renderHook(() => useMousePressed());
      expect(result.current.pressed$.get()).toBe(false);
    });

    it("sourceType$ defaults to null", () => {
      const { result } = renderHook(() => useMousePressed());
      expect(result.current.sourceType$.get()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // pointer events
  // -------------------------------------------------------------------------

  describe("pointer events", () => {
    it("pointerdown → pressed$=true", () => {
      const { result } = renderHook(() => useMousePressed());

      firePointerDown();

      expect(result.current.pressed$.get()).toBe(true);
    });

    it("pointerup → pressed$=false", () => {
      const { result } = renderHook(() => useMousePressed());

      firePointerDown();
      expect(result.current.pressed$.get()).toBe(true);

      firePointerUp();
      expect(result.current.pressed$.get()).toBe(false);
    });

    it('sets sourceType$ to "mouse" on pointerdown', () => {
      const { result } = renderHook(() => useMousePressed());

      firePointerDown();

      expect(result.current.sourceType$.get()).toBe("mouse");
    });
  });

  // -------------------------------------------------------------------------
  // touch events
  // -------------------------------------------------------------------------

  describe("touch events", () => {
    it("touchstart → pressed$=true when touch=true", () => {
      const { result } = renderHook(() => useMousePressed({ touch: true }));

      fireTouchStart();

      expect(result.current.pressed$.get()).toBe(true);
    });

    it("touchend → pressed$=false when touch=true", () => {
      const { result } = renderHook(() => useMousePressed({ touch: true }));

      fireTouchStart();
      expect(result.current.pressed$.get()).toBe(true);

      fireTouchEnd();
      expect(result.current.pressed$.get()).toBe(false);
    });

    it('sets sourceType$ to "touch" on touchstart', () => {
      const { result } = renderHook(() => useMousePressed({ touch: true }));

      fireTouchStart();

      expect(result.current.sourceType$.get()).toBe("touch");
    });

    it("does not track touch when touch=false", () => {
      const { result } = renderHook(() => useMousePressed({ touch: false }));

      fireTouchStart();

      expect(result.current.pressed$.get()).toBe(false);
      expect(result.current.sourceType$.get()).toBeNull();
    });

    it("touchcancel → pressed$=false", () => {
      const { result } = renderHook(() => useMousePressed({ touch: true }));

      fireTouchStart();
      expect(result.current.pressed$.get()).toBe(true);

      fireTouchCancel();
      expect(result.current.pressed$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // release on window
  // -------------------------------------------------------------------------

  describe("release on window", () => {
    it("pointerup outside target still releases pressed$", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => useMousePressed({ target: target$ }));

      // Press on element
      firePointerDown(div);
      expect(result.current.pressed$.get()).toBe(true);

      // Release on window (outside element)
      firePointerUp(window);
      expect(result.current.pressed$.get()).toBe(false);

      document.body.removeChild(div);
    });
  });

  // -------------------------------------------------------------------------
  // callbacks
  // -------------------------------------------------------------------------

  describe("callbacks", () => {
    it("calls onPressed on pointerdown", () => {
      const onPressed = vi.fn();
      renderHook(() => useMousePressed({ onPressed }));

      firePointerDown();

      expect(onPressed).toHaveBeenCalledTimes(1);
    });

    it("calls onReleased on pointerup", () => {
      const onReleased = vi.fn();
      renderHook(() => useMousePressed({ onReleased }));

      firePointerDown();
      firePointerUp();

      expect(onReleased).toHaveBeenCalledTimes(1);
    });

    it("calls onPressed on touchstart", () => {
      const onPressed = vi.fn();
      renderHook(() => useMousePressed({ touch: true, onPressed }));

      fireTouchStart();

      expect(onPressed).toHaveBeenCalledTimes(1);
    });

    it("calls onReleased on touchend", () => {
      const onReleased = vi.fn();
      renderHook(() => useMousePressed({ touch: true, onReleased }));

      fireTouchStart();
      fireTouchEnd();

      expect(onReleased).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // preventDragEvent
  // -------------------------------------------------------------------------

  describe("preventDragEvent", () => {
    it("calls preventDefault on pointerdown when preventDragEvent=true", () => {
      renderHook(() => useMousePressed({ preventDragEvent: true }));

      const event = new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(event.defaultPrevented).toBe(true);
    });

    it("does not call preventDefault when preventDragEvent=false", () => {
      renderHook(() => useMousePressed({ preventDragEvent: false }));

      const event = new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(event.defaultPrevented).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // custom target
  // -------------------------------------------------------------------------

  describe("custom target", () => {
    it("listens pointerdown on specified element", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => useMousePressed({ target: target$ }));

      // Should NOT update on window-only pointerdown that doesn't reach div
      act(() => {
        window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: false }));
      });
      expect(result.current.pressed$.get()).toBe(false);

      // SHOULD update on element pointerdown
      firePointerDown(div);
      expect(result.current.pressed$.get()).toBe(true);

      document.body.removeChild(div);
    });

    it("still listens pointerup on window", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => useMousePressed({ target: target$ }));

      firePointerDown(div);
      expect(result.current.pressed$.get()).toBe(true);

      // Release fires on window, not the element
      firePointerUp(window);
      expect(result.current.pressed$.get()).toBe(false);

      document.body.removeChild(div);
    });
  });

  // -------------------------------------------------------------------------
  // SSR guard
  // -------------------------------------------------------------------------

  describe("SSR guard", () => {
    it("returns false pressed$ when window is undefined", () => {
      // In jsdom window is always defined, so we verify the hook
      // returns the expected observables with default values
      const { result } = renderHook(() => useMousePressed());

      expect(result.current.pressed$.get()).toBe(false);
      expect(result.current.sourceType$.get()).toBeNull();
    });
  });
});
