// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useFocusWithin } from ".";

describe("useFocusWithin() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Ref$ target", () => {
    it("null → element: starts tracking focusin events", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocusWithin(el$) };
      });

      const container = document.createElement("div");
      const child = document.createElement("input");
      container.appendChild(child);

      act(() => {
        result.current.el$(container);
      });

      act(() => {
        child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });

      expect(result.current.focused$.get()).toBe(true);
    });

    it("element → null: focusin events no longer update focused$", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocusWithin(el$) };
      });

      const container = document.createElement("div");
      const child = document.createElement("input");
      container.appendChild(child);

      act(() => {
        result.current.el$(container);
      });
      act(() => {
        child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);

      // Set ref to null — useEventListener detaches listeners
      act(() => {
        result.current.el$(null);
      });

      const valueAfterNull = result.current.focused$.get();

      // Further focusin on the old element should not update focused$
      act(() => {
        child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });

      expect(result.current.focused$.get()).toBe(valueAfterNull);
    });

    it("full cycle (null → element → null → element): no resource leaks", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocusWithin(el$) };
      });

      // Cycle 1: mount container1, verify focusin works
      const container1 = document.createElement("div");
      const child1 = document.createElement("input");
      container1.appendChild(child1);

      const addSpy1 = vi.spyOn(container1, "addEventListener");
      const removeSpy1 = vi.spyOn(container1, "removeEventListener");

      act(() => {
        result.current.el$(container1);
      });

      act(() => {
        child1.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);

      act(() => {
        result.current.el$(null);
      });

      // Symmetric add/remove after unmount
      expect(addSpy1.mock.calls.length).toBe(removeSpy1.mock.calls.length);

      // Cycle 2: mount container2, verify focusin still works
      const container2 = document.createElement("div");
      const child2 = document.createElement("input");
      container2.appendChild(child2);

      act(() => {
        result.current.el$(container2);
      });

      act(() => {
        child2.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);
    });

    it("dispatched focusin event updates state after element mount (functional verification)", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocusWithin(el$) };
      });

      const container = document.createElement("div");
      const child = document.createElement("input");
      container.appendChild(child);

      act(() => {
        result.current.el$(container);
      });

      // Initially false
      expect(result.current.focused$.get()).toBe(false);

      // focusin → true
      act(() => {
        child.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      });
      expect(result.current.focused$.get()).toBe(true);
    });
  });
});
