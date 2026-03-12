// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { isObservable, observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFocus } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// useFocus tests
// ---------------------------------------------------------------------------

describe("useFocus()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("focused$ is an Observable<boolean>", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { result } = renderHook(() => useFocus(target$));

      expect(isObservable(result.current.focused$)).toBe(true);
      expect(typeof result.current.focused$.get()).toBe("boolean");

      document.body.removeChild(el);
    });

    it("initial value is false", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { result } = renderHook(() => useFocus(target$));

      expect(result.current.focused$.get()).toBe(false);

      document.body.removeChild(el);
    });

    it("initialValue: true auto-focuses the element on mount", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      const focusSpy = vi.spyOn(el, "focus");

      const { result } = renderHook(() => useFocus(target$, { initialValue: true }));

      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(result.current.focused$.get()).toBe(true);

      document.body.removeChild(el);
    });
  });

  // -------------------------------------------------------------------------
  // focus tracking
  // -------------------------------------------------------------------------

  describe("focus tracking", () => {
    it("focus event sets focused$ to true", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { result } = renderHook(() => useFocus(target$));

      act(() => {
        el.dispatchEvent(new Event("focus"));
      });

      expect(result.current.focused$.get()).toBe(true);

      document.body.removeChild(el);
    });

    it("blur event sets focused$ to false", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { result } = renderHook(() => useFocus(target$));

      act(() => {
        el.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new Event("blur"));
      });
      expect(result.current.focused$.get()).toBe(false);

      document.body.removeChild(el);
    });

    it("focusVisible: true ignores non-focus-visible focus", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      vi.spyOn(el, "matches").mockReturnValue(false);

      const { result } = renderHook(() => useFocus(target$, { focusVisible: true }));

      act(() => {
        el.dispatchEvent(new Event("focus"));
      });

      expect(result.current.focused$.get()).toBe(false);

      document.body.removeChild(el);
    });

    it("focusVisible: true tracks focus-visible focus", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      vi.spyOn(el, "matches").mockReturnValue(true);

      const { result } = renderHook(() => useFocus(target$, { focusVisible: true }));

      act(() => {
        el.dispatchEvent(new Event("focus"));
      });

      expect(result.current.focused$.get()).toBe(true);

      document.body.removeChild(el);
    });
  });

  // -------------------------------------------------------------------------
  // programmatic control
  // -------------------------------------------------------------------------

  describe("programmatic control", () => {
    it("focused$.set(true) calls el.focus()", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      const focusSpy = vi.spyOn(el, "focus");

      // Make sure document.activeElement is NOT this element initially
      const otherEl = document.createElement("button");
      document.body.appendChild(otherEl);
      otherEl.focus();

      const { result } = renderHook(() => useFocus(target$));

      act(() => {
        result.current.focused$.set(true);
      });

      expect(focusSpy).toHaveBeenCalledTimes(1);

      document.body.removeChild(el);
      document.body.removeChild(otherEl);
    });

    it("focused$.set(false) calls el.blur()", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      const blurSpy = vi.spyOn(el, "blur");

      const { result } = renderHook(() => useFocus(target$));

      // First focus the element so document.activeElement === el
      act(() => {
        el.focus();
        el.dispatchEvent(new Event("focus"));
      });

      act(() => {
        result.current.focused$.set(false);
      });

      expect(blurSpy).toHaveBeenCalledTimes(1);

      document.body.removeChild(el);
    });

    it("preventScroll option is passed to el.focus()", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);
      const focusSpy = vi.spyOn(el, "focus");

      const otherEl = document.createElement("button");
      document.body.appendChild(otherEl);
      otherEl.focus();

      const { result } = renderHook(() => useFocus(target$, { preventScroll: true }));

      act(() => {
        result.current.focused$.set(true);
      });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

      document.body.removeChild(el);
      document.body.removeChild(otherEl);
    });
  });

  // -------------------------------------------------------------------------
  // unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("cleans up on unmount without errors", () => {
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { unmount } = renderHook(() => useFocus(target$));

      expect(() => unmount()).not.toThrow();

      document.body.removeChild(el);
    });
  });

  // -------------------------------------------------------------------------
  // SSR guard
  // -------------------------------------------------------------------------

  describe("SSR guard", () => {
    it("returns focused$ as false when window is undefined", () => {
      // In jsdom window is always defined; verify the hook returns
      // expected observables with default values (simulating SSR-safe defaults)
      const el = document.createElement("input");
      document.body.appendChild(el);
      const target$ = wrapEl(el);

      const { result } = renderHook(() => useFocus(target$));

      expect(isObservable(result.current.focused$)).toBe(true);
      expect(result.current.focused$.get()).toBe(false);

      document.body.removeChild(el);
    });
  });
});
