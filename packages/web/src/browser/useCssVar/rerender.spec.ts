// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { ObservableHint, type OpaqueObject } from "@legendapp/state";
import { useCssVar } from ".";

class MockMutationObserver {
  static instances: MockMutationObserver[] = [];
  callback: MutationCallback;
  observedTargets: Node[] = [];

  constructor(callback: MutationCallback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }

  observe(target: Node) {
    this.observedTargets.push(target);
  }

  disconnect() {
    this.observedTargets = [];
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  static reset() {
    MockMutationObserver.instances = [];
  }
}

function makeTarget(el: HTMLElement) {
  return observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));
}

describe("useCssVar() — rerender stability", () => {
  beforeEach(() => {
    MockMutationObserver.reset();
    vi.stubGlobal("MutationObserver", MockMutationObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    document.documentElement.style.cssText = "";
  });

  describe("value accuracy", () => {
    it("variable$ value is preserved after re-render", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result, rerender } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#7fa998");
      });

      rerender();
      rerender();

      expect(result.current.get()).toBe("#7fa998");
    });

    it("CSS property on element remains set after re-render", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result, rerender } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#df8543");
      });

      rerender();
      rerender();

      expect(el.style.getPropertyValue("--color")).toBe("#df8543");
    });

    it("documentElement fallback: value preserved after re-render", () => {
      const { result, rerender } = renderHook(() => useCssVar("--theme"));

      act(() => {
        result.current.set("#123456");
      });

      rerender();

      expect(result.current.get()).toBe("#123456");
      expect(document.documentElement.style.getPropertyValue("--theme")).toBe("#123456");
    });
  });

  describe("resource stability", () => {
    it("observe=true: MutationObserver is not recreated on re-render", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { rerender } = renderHook(() => useCssVar("--color", target$, { observe: true }));

      const instanceCountAfterMount = MockMutationObserver.instances.length;

      rerender();
      rerender();

      expect(MockMutationObserver.instances.length).toBe(instanceCountAfterMount);
    });

    it("Observable prop change does not break value tracking after re-render", () => {
      const el = document.createElement("div");
      el.style.setProperty("--bg", "blue");
      document.body.appendChild(el);
      const target$ = makeTarget(el);
      const prop$ = observable<string>("--bg");

      const { result, rerender } = renderHook(() => useCssVar(prop$, target$));

      act(() => {
        result.current.set("blue");
      });

      rerender();

      expect(result.current.get()).toBe("blue");
      expect(el.style.getPropertyValue("--bg")).toBe("blue");
    });
  });
});
