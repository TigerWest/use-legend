// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useFocus } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useFocus() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not re-register event listeners when unrelated state causes re-render", () => {
      const el = document.createElement("input");
      const target$ = wrapEl(el);
      const addSpy = vi.spyOn(el, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useFocus(target$);
        },
        { initialProps: { count: 0 } }
      );

      // Capture call count after initial mount
      const addCountAfterMount = addSpy.mock.calls.length;

      // Re-render with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      // No new addEventListener calls should have been made
      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("focused$ remains accurate after re-render", () => {
      const el = document.createElement("input");
      const target$ = wrapEl(el);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useFocus(target$);
        },
        { initialProps: { count: 0 } }
      );

      // Dispatch focus event
      act(() => {
        el.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);

      // Trigger re-render
      rerender({ count: 1 });

      // focused$ should still be true
      expect(result.current.focused$.get()).toBe(true);

      // Dispatch blur event
      act(() => {
        el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      });

      // focused$ should be false
      expect(result.current.focused$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // stable return references
  // -------------------------------------------------------------------------

  describe("stable return references", () => {
    it("focused$ reference is stable across re-renders", () => {
      const el = document.createElement("input");
      const target$ = wrapEl(el);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useFocus(target$);
        },
        { initialProps: { count: 0 } }
      );

      const focusedBefore = result.current.focused$;

      rerender({ count: 1 });

      const focusedAfter = result.current.focused$;

      // Same Observable instance
      expect(focusedAfter).toBe(focusedBefore);
    });
  });
});
