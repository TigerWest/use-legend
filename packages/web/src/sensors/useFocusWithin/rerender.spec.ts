// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useFocusWithin } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useFocusWithin() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register event listeners when unrelated state causes re-render", () => {
      const container = document.createElement("div");
      const input = document.createElement("input");
      container.appendChild(input);
      const target$ = wrapEl(container);

      const addSpy = vi.spyOn(container, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useFocusWithin(target$);
        },
        { initialProps: { count: 0 } }
      );

      const addCountAfterMount = addSpy.mock.calls.length;

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("focused$ remains true after re-render when focusin was dispatched", () => {
      const container = document.createElement("div");
      const child = document.createElement("input");
      container.appendChild(child);
      const target$ = wrapEl(container);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useFocusWithin(target$);
        },
        { initialProps: { count: 0 } }
      );

      act(() => {
        child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);

      rerender({ count: 1 });
      expect(result.current.focused$.get()).toBe(true);

      rerender({ count: 2 });
      expect(result.current.focused$.get()).toBe(true);
    });
  });
});
