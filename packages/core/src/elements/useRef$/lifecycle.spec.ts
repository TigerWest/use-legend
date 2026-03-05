// @vitest-environment jsdom
import { render, renderHook, act } from "@testing-library/react";
import { useObserve } from "@legendapp/state/react";
import { createElement, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { getElement, useRef$ } from ".";

// ---------------------------------------------------------------------------
// useRef$() — element lifecycle
//
// useRef$ does not manage resources (no cleanup, no observers, no listeners).
// These tests verify that the observable value transitions correctly as elements
// are conditionally mounted/unmounted — accuracy matters because useRef$ is the
// foundation for all element-targeting hooks.
// ---------------------------------------------------------------------------

describe("useRef$() — element lifecycle", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("tracks unmount when element is bound with ref={el$}", () => {
      const observeSpy = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useObserve(() => {
          getElement(el$);
          observeSpy();
        });
        return el$;
      });

      expect(observeSpy).toHaveBeenCalledTimes(1);
      expect(result.current.get()).toBeNull();

      const { unmount } = render(createElement("div", { ref: result.current }));
      expect(observeSpy).toHaveBeenCalledTimes(2);
      expect(result.current.get()).not.toBeNull();

      act(() => {
        unmount();
      });

      expect(observeSpy).toHaveBeenCalledTimes(3);
      expect(result.current.get()).toBeNull();
    });

    it("Ref$ transitions to null when element is conditionally unmounted", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const el$ = result.current;

      const div = document.createElement("div");

      act(() => {
        el$(div);
      });
      expect(el$.get()).toBe(div);

      act(() => {
        el$(null);
      });
      expect(el$.get()).toBeNull();
    });

    it("Ref$ receives new element when conditionally remounted", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const el$ = result.current;

      const div1 = document.createElement("div");
      const div2 = document.createElement("div");

      // mount
      act(() => {
        el$(div1);
      });
      expect(el$.get()).toBe(div1);

      // unmount
      act(() => {
        el$(null);
      });
      expect(el$.get()).toBeNull();

      // remount with new element
      act(() => {
        el$(div2);
      });
      expect(el$.get()).toBe(div2);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("null → element → null → element: observable updates correctly at each step", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const el$ = result.current;

      // null (initial)
      expect(el$.get()).toBeNull();

      const div1 = document.createElement("div");
      act(() => {
        el$(div1);
      });
      // element
      expect(el$.get()).toBe(div1);

      act(() => {
        el$(null);
      });
      // null again
      expect(el$.get()).toBeNull();

      const div2 = document.createElement("div");
      act(() => {
        el$(div2);
      });
      // new element
      expect(el$.get()).toBe(div2);
    });

    it("useObserve subscription tracks all transitions in the full lifecycle", () => {
      const values: (HTMLDivElement | null)[] = [];

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useObserve(() => {
          const raw = el$.get();
          // valueOf() unwraps the OpaqueObject — null stays null
          values.push(raw ? (raw.valueOf() as HTMLDivElement) : null);
        });
        return el$;
      });

      // step 0: initial null
      expect(values).toEqual([null]);

      const div1 = document.createElement("div");
      act(() => {
        result.current(div1);
      });
      // step 1: element assigned
      expect(values[1]).toBe(div1);

      act(() => {
        result.current(null);
      });
      // step 2: back to null
      expect(values[2]).toBeNull();

      const div2 = document.createElement("div");
      act(() => {
        result.current(div2);
      });
      // step 3: new element
      expect(values[3]).toBe(div2);

      // all four transitions were received
      expect(values).toHaveLength(4);
    });
  });
});
