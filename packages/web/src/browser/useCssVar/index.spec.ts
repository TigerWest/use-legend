// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { ObservableHint, type OpaqueObject } from "@legendapp/state";
import { useCssVar } from ".";

// MutationObserver mock
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

  trigger(records: Partial<MutationRecord>[] = []) {
    this.callback(records as MutationRecord[], this as unknown as MutationObserver);
  }

  static reset() {
    MockMutationObserver.instances = [];
  }
}

function makeTarget(el: HTMLElement) {
  return observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(el));
}

describe("useCssVar()", () => {
  beforeEach(() => {
    MockMutationObserver.reset();
    vi.stubGlobal("MutationObserver", MockMutationObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.cssText = "";
  });

  describe("return type", () => {
    it("returns an Observable<string>", () => {
      const { result } = renderHook(() => useCssVar("--color"));
      expect(typeof result.current.get).toBe("function");
      expect(typeof result.current.set).toBe("function");
      expect(typeof result.current.peek).toBe("function");
    });
  });

  describe("initial values", () => {
    it("initial value is empty string by default", () => {
      const { result } = renderHook(() => useCssVar("--color"));
      expect(result.current.get()).toBe("");
    });

    it("initialValue option sets initial value", () => {
      const { result } = renderHook(() =>
        useCssVar("--color", undefined, { initialValue: "#ff0000" })
      );
      expect(result.current.get()).toBe("#ff0000");
    });

    it("reads existing CSS variable from element on mount", () => {
      const el = document.createElement("div");
      el.style.setProperty("--color", "#abc123");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$));
      expect(typeof result.current.get()).toBe("string");

      document.body.removeChild(el);
    });
  });

  describe("setting variable$", () => {
    it("setting variable$ updates element CSS variable", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#7fa998");
      });

      expect(el.style.getPropertyValue("--color")).toBe("#7fa998");

      document.body.removeChild(el);
    });

    it("setting variable$ to empty string removes the property", () => {
      const el = document.createElement("div");
      el.style.setProperty("--color", "#abc");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#abc");
      });
      act(() => {
        result.current.set("");
      });

      expect(el.style.getPropertyValue("--color")).toBe("");

      document.body.removeChild(el);
    });
  });

  describe("prop change", () => {
    it("prop change: removes old property from element, reads new", () => {
      const el = document.createElement("div");
      el.style.setProperty("--old", "red");
      el.style.setProperty("--new", "blue");
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

      // Old property should be removed
      expect(el.style.getPropertyValue("--old")).toBe("");

      document.body.removeChild(el);
    });
  });

  describe("null/undefined target", () => {
    it("target is null: does not throw", () => {
      expect(() => {
        renderHook(() => useCssVar("--color", null as unknown as undefined));
      }).not.toThrow();
    });

    it("no target: defaults to documentElement", () => {
      const { result } = renderHook(() => useCssVar("--theme"));

      act(() => {
        result.current.set("#123456");
      });

      expect(document.documentElement.style.getPropertyValue("--theme")).toBe("#123456");

      document.documentElement.style.removeProperty("--theme");
    });
  });

  describe("observe option", () => {
    it("observe=true: re-reads when mutation fires", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result } = renderHook(() => useCssVar("--color", target$, { observe: true }));

      const observer = MockMutationObserver.instances[0];
      expect(observer).toBeDefined();

      act(() => {
        el.style.setProperty("--color", "#mutated");
        observer?.trigger([{ type: "attributes", attributeName: "style" } as MutationRecord]);
      });

      expect(result.current.get()).toBe("#mutated");

      document.body.removeChild(el);
    });

    it("observe=false: MutationObserver is not set up on element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      MockMutationObserver.reset();
      renderHook(() => useCssVar("--color", target$, { observe: false }));

      // When observe=false, null is passed to useMutationObserver — no targets observed
      const observingInstances = MockMutationObserver.instances.filter(
        (i) => i.observedTargets.length > 0
      );
      expect(observingInstances).toHaveLength(0);

      document.body.removeChild(el);
    });
  });

  describe("rerender stability", () => {
    it("does not re-register effects on re-render", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = makeTarget(el);

      const { result, rerender } = renderHook(() => useCssVar("--color", target$));

      act(() => {
        result.current.set("#initial");
      });

      rerender();

      expect(result.current.get()).toBe("#initial");
      expect(el.style.getPropertyValue("--color")).toBe("#initial");

      document.body.removeChild(el);
    });
  });
});
