// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useParentElement } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

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
// useParentElement — rerender stability
// ---------------------------------------------------------------------------

describe("useParentElement() — rerender stability", () => {
  describe("value accuracy", () => {
    it("parent$ value remains correct after unrelated state causes re-render", () => {
      const child = document.createElement("span");
      const { parent } = attachToBody(child);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useParentElement(wrapEl(child) as any);
        },
        { initialProps: { count: 0 } }
      );

      expect(result.current.get()).toBe(parent);

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(result.current.get()).toBe(parent);
    });
  });

  describe("resource stability", () => {
    it("does not trigger unnecessary observable updates on re-render", () => {
      const child = document.createElement("span");
      attachToBody(child);

      let updateCount = 0;

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          const parent$ = useParentElement(wrapEl(child) as any);
          // Track how many times the observable value changes
          parent$.onChange(() => {
            updateCount++;
          });
          return parent$;
        },
        { initialProps: { count: 0 } }
      );

      const countAfterMount = updateCount;

      rerender({ count: 1 });
      rerender({ count: 2 });

      // No additional observable updates should have fired from re-renders alone
      expect(updateCount).toBe(countAfterMount);
    });
  });

  describe("stable return references", () => {
    it("parent$ observable reference is stable across re-renders", () => {
      const child = document.createElement("span");
      attachToBody(child);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useParentElement(wrapEl(child) as any);
        },
        { initialProps: { count: 0 } }
      );

      const ref0 = result.current;

      rerender({ count: 1 });
      const ref1 = result.current;

      rerender({ count: 2 });
      const ref2 = result.current;

      expect(ref0).toBe(ref1);
      expect(ref1).toBe(ref2);
    });
  });
});
