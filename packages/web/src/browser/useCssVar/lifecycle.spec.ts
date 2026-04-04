// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable, ObservableHint, type OpaqueObject } from "@legendapp/state";
import { useRef$ } from "@usels/core";
import { useCssVar } from ".";

class MockMutationObserver {
  observe() {}
  disconnect() {}
  takeRecords(): MutationRecord[] {
    return [];
  }
}

beforeEach(() => {
  vi.stubGlobal("MutationObserver", MockMutationObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
  document.documentElement.style.cssText = "";
});

function makeTarget(el: HTMLElement | null) {
  return observable<OpaqueObject<HTMLElement> | null>(el ? ObservableHint.opaque(el) : null);
}

describe("useCssVar() — element lifecycle", () => {
  describe("Observable target", () => {
    it("null → element: set() after element assigned writes to element", () => {
      const target$ = makeTarget(null);
      const { result } = renderHook(() => useCssVar("--color", target$));

      const el = document.createElement("div");
      document.body.appendChild(el);
      act(() => {
        target$.set(ObservableHint.opaque(el));
      });

      // set() after element is assigned → writes to element
      act(() => {
        result.current.set("#ff0000");
      });

      expect(el.style.getPropertyValue("--color")).toBe("#ff0000");
    });

    it("element → null: removes CSS var from old element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#aabbcc");
      });
      expect(el.style.getPropertyValue("--color")).toBe("#aabbcc");

      act(() => {
        target$.set(null);
      });

      // Old element's CSS var is removed
      expect(el.style.getPropertyValue("--color")).toBe("");
    });

    it("element → null: subsequent set() writes to documentElement", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#aabbcc");
      });
      act(() => {
        target$.set(null);
      });
      act(() => {
        result.current.set("#newval");
      });

      expect(document.documentElement.style.getPropertyValue("--color")).toBe("#newval");
    });

    it("el1 → el2: CSS var removed from el1 on target change", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      document.body.append(el1, el2);
      const target$ = makeTarget(el1);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#111111");
      });
      expect(el1.style.getPropertyValue("--color")).toBe("#111111");

      act(() => {
        target$.set(ObservableHint.opaque(el2));
      });

      expect(el1.style.getPropertyValue("--color")).toBe("");
    });

    it("el1 → el2: set() after target change writes to el2", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      document.body.append(el1, el2);
      const target$ = makeTarget(el1);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#111111");
      });
      act(() => {
        target$.set(ObservableHint.opaque(el2));
      });
      act(() => {
        result.current.set("#222222");
      });

      expect(el1.style.getPropertyValue("--color")).toBe("");
      expect(el2.style.getPropertyValue("--color")).toBe("#222222");
    });
  });

  describe("Ref$ target", () => {
    it("null → element: set() after Ref$ assigned writes to element", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const color$ = useCssVar("--color", el$);
        return { el$, color$ };
      });

      const div = document.createElement("div");
      document.body.appendChild(div);
      act(() => result.current.el$(div));

      act(() => {
        result.current.color$.set("#00ff00");
      });

      expect(div.style.getPropertyValue("--color")).toBe("#00ff00");
    });

    it("element → null: removes CSS var from element on Ref$ clear", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const color$ = useCssVar("--color", el$);
        return { el$, color$ };
      });

      act(() => result.current.el$(div));
      act(() => {
        result.current.color$.set("#cccccc");
      });
      expect(div.style.getPropertyValue("--color")).toBe("#cccccc");

      act(() => result.current.el$(null));

      expect(div.style.getPropertyValue("--color")).toBe("");
    });
  });

  describe("prop change lifecycle", () => {
    it("prop change: old CSS var removed, new prop written with current value", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);
      const prop$ = observable<string>("--old");

      const { result } = renderHook(() => useCssVar(prop$, target$));

      act(() => {
        result.current.set("red");
      });
      expect(el.style.getPropertyValue("--old")).toBe("red");

      act(() => {
        prop$.set("--new");
      });

      expect(el.style.getPropertyValue("--old")).toBe("");
      // After prop change, variable$ still holds "red" — next set() writes --new
      act(() => {
        result.current.set("red");
      });
      expect(el.style.getPropertyValue("--new")).toBe("red");
    });
  });
});
