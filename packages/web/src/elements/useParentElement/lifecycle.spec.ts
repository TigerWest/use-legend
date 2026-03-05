// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useParentElement } from ".";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const attached: Element[] = [];

function attachToBody<T extends Element>(child: T): { child: T; parent: HTMLDivElement } {
  const parent = document.createElement("div");
  parent.appendChild(child);
  document.body.appendChild(parent);
  attached.push(parent);
  return { child, parent };
}

afterEach(() => {
  attached.forEach((el) => el.parentNode?.removeChild(el));
  attached.length = 0;
});

// ---------------------------------------------------------------------------
// useParentElement — element lifecycle
// ---------------------------------------------------------------------------

describe("useParentElement() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("reacts to Ref$ — returns parent after element is assigned", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLSpanElement>();
        return { el$, parent$: useParentElement(el$) };
      });

      expect(result.current.parent$.get()).toBeNull();

      act(() => result.current.el$(child));

      expect(result.current.parent$.get()).toBe(parent);
    });

    it("reads parent of Ref$ that already holds an element at mount time", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      let sharedRef$: ReturnType<typeof useRef$<HTMLSpanElement>>;
      const { result: elResult } = renderHook(() => {
        const el$ = useRef$<HTMLSpanElement>();
        sharedRef$ = el$;
        return el$;
      });

      act(() => {
        elResult.current(child);
      });

      const { result } = renderHook(() => useParentElement(sharedRef$!));

      expect(result.current.get()).toBe(parent);
    });

    it("Ref$ element → null: parent$ becomes null", () => {
      const child = document.createElement("span");
      attachToBody(child);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLSpanElement>();
        return { el$, parent$: useParentElement(el$) };
      });

      act(() => result.current.el$(child));
      expect(result.current.parent$.get()).not.toBeNull();

      act(() => result.current.el$(null));
      expect(result.current.parent$.get()).toBeNull();
    });

    it("Ref$ null → element → null: parent$ correctly transitions at each step", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLSpanElement>();
        return { el$, parent$: useParentElement(el$) };
      });

      // null
      expect(result.current.parent$.get()).toBeNull();

      // element
      act(() => result.current.el$(child));
      expect(result.current.parent$.get()).toBe(parent);

      // null
      act(() => result.current.el$(null));
      expect(result.current.parent$.get()).toBeNull();
    });
  });

  describe("Observable target", () => {
    it("reacts to Observable<Element|null> — updates when value is set", () => {
      const child = document.createElement("p");
      const { parent } = attachToBody(child);

      const target$ = observable<HTMLElement | null>(null);

      const { result } = renderHook(() => useParentElement(target$ as any));

      expect(result.current.get()).toBeNull();

      act(() => {
        target$.set(child);
      });

      expect(result.current.get()).toBe(parent);
    });

    it("returns null when Observable is set to null", () => {
      const child = document.createElement("span");
      attachToBody(child);

      const target$ = observable<HTMLElement | null>(child);

      const { result } = renderHook(() => useParentElement(target$ as any));

      act(() => {
        target$.set(null);
      });

      expect(result.current.get()).toBeNull();
    });

    it("Observable target element A → element B: parent$ reflects new parent", () => {
      const childA = document.createElement("span");
      const { parent: parentA } = attachToBody(childA);

      const childB = document.createElement("em");
      const { parent: parentB } = attachToBody(childB);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(childA));

      const { result } = renderHook(() => useParentElement(target$ as any));

      expect(result.current.get()).toBe(parentA);

      act(() => {
        target$.set(ObservableHint.opaque(childB));
      });

      expect(result.current.get()).toBe(parentB);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("handles null → value → null cycle for Observable", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const target$ = observable<HTMLElement | null>(null);
      const { result } = renderHook(() => useParentElement(target$ as any));

      expect(result.current.get()).toBeNull();

      act(() => {
        target$.set(child);
      });
      expect(result.current.get()).toBe(parent);

      act(() => {
        target$.set(null);
      });
      expect(result.current.get()).toBeNull();
    });

    it("Ref$ null → element → null → element: parent$ correctly reflects each state", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLSpanElement>();
        return { el$, parent$: useParentElement(el$) };
      });

      // null
      expect(result.current.parent$.get()).toBeNull();

      // element
      act(() => result.current.el$(child));
      expect(result.current.parent$.get()).toBe(parent);

      // null
      act(() => result.current.el$(null));
      expect(result.current.parent$.get()).toBeNull();

      // element again
      act(() => result.current.el$(child));
      expect(result.current.parent$.get()).toBe(parent);
    });

    it("Observable null → element → null → element: parent$ correctly reflects each state", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const target$ = observable<HTMLElement | null>(null);
      const { result } = renderHook(() => useParentElement(target$ as any));

      // null
      expect(result.current.get()).toBeNull();

      // element
      act(() => target$.set(child));
      expect(result.current.get()).toBe(parent);

      // null
      act(() => target$.set(null));
      expect(result.current.get()).toBeNull();

      // element again
      act(() => target$.set(child));
      expect(result.current.get()).toBe(parent);
    });
  });
});
