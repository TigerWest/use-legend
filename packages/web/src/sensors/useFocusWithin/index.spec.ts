// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { isObservable, observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useFocusWithin } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests — JSDOM can only verify focusin (sets true) and basic structure.
// focusout + :focus-within behavior is tested in index.browser.spec.ts.
// ---------------------------------------------------------------------------

describe("useFocusWithin()", () => {
  describe("initial values", () => {
    it("focused$ is an Observable<boolean>", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const target$ = wrapEl(container);

      const { result } = renderHook(() => useFocusWithin(target$));

      expect(isObservable(result.current.focused$)).toBe(true);
      expect(typeof result.current.focused$.get()).toBe("boolean");

      document.body.removeChild(container);
    });

    it("initial value is false", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const target$ = wrapEl(container);

      const { result } = renderHook(() => useFocusWithin(target$));

      expect(result.current.focused$.get()).toBe(false);

      document.body.removeChild(container);
    });
  });

  describe("focus tracking", () => {
    it("child element focusin sets focused$ to true", () => {
      const container = document.createElement("div");
      const input = document.createElement("input");
      container.appendChild(input);
      document.body.appendChild(container);
      const target$ = wrapEl(container);

      const { result } = renderHook(() => useFocusWithin(target$));

      act(() => {
        input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });

      expect(result.current.focused$.get()).toBe(true);

      document.body.removeChild(container);
    });

    it("container itself receiving focus sets focused$ to true", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const target$ = wrapEl(container);

      const { result } = renderHook(() => useFocusWithin(target$));

      act(() => {
        container.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });

      expect(result.current.focused$.get()).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe("unmount cleanup", () => {
    it("cleans up on unmount without errors", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const target$ = wrapEl(container);

      const { unmount } = renderHook(() => useFocusWithin(target$));

      expect(() => unmount()).not.toThrow();

      document.body.removeChild(container);
    });
  });
});
