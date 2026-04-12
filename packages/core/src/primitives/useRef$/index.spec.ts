// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { useObserve } from "@legendapp/state/react";
import { describe, it, expect, vi } from "vitest";
import { useRef$ } from ".";

describe("useRef$()", () => {
  it("initial value is null", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    expect(result.current.get()).toBe(null);
  });

  it("registers element in observable when called with an element", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    const div = document.createElement("div");

    act(() => {
      result.current(div);
    });

    expect(result.current.get()).toBe(div);
  });

  it("resets observable to null when called with null", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    const div = document.createElement("div");

    act(() => result.current(div));
    act(() => result.current(null));

    expect(result.current.get()).toBe(null);
  });

  it("el$ is callable and exposes get/peek as functions", () => {
    const { result } = renderHook(() => useRef$());
    expect(typeof result.current).toBe("function");
    expect(typeof result.current.get).toBe("function");
    expect(typeof result.current.peek).toBe("function");
  });

  it("current is null initially", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    expect(result.current.current).toBe(null);
  });

  it("current returns element after assignment", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    const div = document.createElement("div");

    act(() => result.current(div));

    expect(result.current.current).toBe(div);
  });

  it("current resets to null after called with null", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    const div = document.createElement("div");

    act(() => result.current(div));
    act(() => result.current(null));

    expect(result.current.current).toBe(null);
  });

  it("current does not register tracking (peek behavior)", () => {
    const observeSpy = vi.fn();

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      useObserve(() => {
        void el$.current; // access via .current — should NOT register tracking
        observeSpy();
      });
      return el$;
    });

    expect(observeSpy).toHaveBeenCalledTimes(1);

    const div = document.createElement("div");
    act(() => result.current(div));

    // should NOT re-run because .current doesn't track
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it("works without any argument (standalone useRef replacement)", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    const div = document.createElement("div");

    act(() => result.current(div));

    expect(result.current.get()).toBe(div);
  });

  it("handles null gracefully", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>(null));
    const div = document.createElement("div");

    act(() => result.current(div));

    expect(result.current.get()).toBe(div);
  });

  it("triggers useObserve when element is assigned", () => {
    const observeSpy = vi.fn();

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      useObserve(() => {
        el$.get(); // register as selector
        observeSpy();
      });
      return el$;
    });

    // called once on mount
    expect(observeSpy).toHaveBeenCalledTimes(1);

    const div = document.createElement("div");
    act(() => {
      result.current(div);
    });

    // called again when element changes
    expect(observeSpy).toHaveBeenCalledTimes(2);
  });

  describe("Function.prototype methods", () => {
    it("bind returns a function (React DEV safelyDetachRef calls ref.bind(null))", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const ref = result.current;

      expect(typeof ref.bind).toBe("function");

      const bound = ref.bind(null);
      expect(typeof bound).toBe("function");
    });

    it("bound ref still sets the element", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const ref = result.current;
      const bound = ref.bind(null);
      const div = document.createElement("div");

      act(() => bound(div));

      expect(ref.get()).toBe(div);
    });

    it("call invokes the ref callback", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const ref = result.current;
      const div = document.createElement("div");

      act(() => ref.call(null, div));

      expect(ref.get()).toBe(div);
    });

    it("apply invokes the ref callback", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      const ref = result.current;
      const div = document.createElement("div");

      act(() => ref.apply(null, [div]));

      expect(ref.get()).toBe(div);
    });
  });

  describe("initialValue", () => {
    it("get() returns initialValue when provided", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useRef$<HTMLDivElement>(div));
      expect(result.current.get()).toBe(div);
    });

    it("peek() returns initialValue when provided", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useRef$<HTMLDivElement>(div));
      expect(result.current.peek()).toBe(div);
    });

    it("current returns initialValue when provided", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useRef$<HTMLDivElement>(div));
      expect(result.current.current).toBe(div);
    });

    it("initialValue is overwritten when called with new element", () => {
      const initial = document.createElement("div");
      const next = document.createElement("span");
      const { result } = renderHook(() => useRef$<HTMLElement>(initial));

      act(() => result.current(next));

      expect(result.current.get()).toBe(next);
    });

    it("defaults to null when initialValue is not provided", () => {
      const { result } = renderHook(() => useRef$<HTMLDivElement>());
      expect(result.current.get()).toBe(null);
    });
  });
});
