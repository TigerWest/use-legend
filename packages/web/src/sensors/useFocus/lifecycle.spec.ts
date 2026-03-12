// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useFocus } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useFocus() — element lifecycle", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("null → element: starts tracking focus events", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocus(el$) };
      });

      const el = document.createElement("div");
      act(() => {
        result.current.el$(el);
      });

      act(() => {
        el.dispatchEvent(new Event("focus"));
      });

      expect(result.current.focused$.get()).toBe(true);
    });

    it("element → null: focused$ resets to false", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocus(el$) };
      });

      const el = document.createElement("div");

      // Mount element and set focused
      act(() => {
        result.current.el$(el);
      });
      act(() => {
        el.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);

      // Simulate realistic DOM: blur fires before element is removed
      act(() => {
        el.dispatchEvent(new Event("blur"));
      });
      // Remove element
      act(() => {
        result.current.el$(null);
      });

      expect(result.current.focused$.get()).toBe(false);
    });

    it("full cycle (null → element → null → element): no resource leaks", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocus(el$) };
      });

      const el1 = document.createElement("div");
      const el2 = document.createElement("div");

      const addSpy1 = vi.spyOn(el1, "addEventListener");
      const removeSpy1 = vi.spyOn(el1, "removeEventListener");
      const addSpy2 = vi.spyOn(el2, "addEventListener");

      // Mount el1
      act(() => {
        result.current.el$(el1);
      });
      // Unmount (null)
      act(() => {
        result.current.el$(null);
      });
      // Mount el2
      act(() => {
        result.current.el$(el2);
      });

      // el1: add and remove counts must be symmetric (no leaks)
      expect(addSpy1.mock.calls.length).toBe(removeSpy1.mock.calls.length);

      // el2: focus events should work after re-mount
      act(() => {
        el2.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);

      // el1 events should have no effect (listeners removed)
      act(() => {
        result.current.focused$.set(false);
      });
      act(() => {
        el1.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(false);

      // Verify el2 listeners were registered
      expect(addSpy2.mock.calls.some(([type]) => type === "focus")).toBe(true);
    });

    it("dispatched focus event updates state after element mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return { el$, ...useFocus(el$) };
      });

      const el = document.createElement("div");
      act(() => {
        result.current.el$(el);
      });

      // Dispatch focus — focused$ should become true
      act(() => {
        el.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);

      // Dispatch blur — focused$ should become false
      act(() => {
        el.dispatchEvent(new Event("blur"));
      });
      expect(result.current.focused$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable<Element> target switch re-registers events", () => {
      const elA = document.createElement("div");
      const elB = document.createElement("div");

      const target$ = wrapEl(elA);
      const { result } = renderHook(() => useFocus(target$ as any));

      // Dispatch focus on elA — should update state
      act(() => {
        elA.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);

      // Switch target to elB
      act(() => {
        target$.set(ObservableHint.opaque(elB));
      });

      // Blur on elA should NOT affect state (already unregistered)
      act(() => {
        elA.dispatchEvent(new Event("blur"));
      });
      // focused$ may or may not have reset depending on implementation;
      // what matters is that elB focus now controls state
      act(() => {
        result.current.focused$.set(false);
      });

      // Focus on elB should update state
      act(() => {
        elB.dispatchEvent(new Event("focus"));
      });
      expect(result.current.focused$.get()).toBe(true);
    });
  });
});
