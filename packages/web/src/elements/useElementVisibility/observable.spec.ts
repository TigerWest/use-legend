// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { isObservable, observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "@usels/core";
import { useElementVisibility } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedInit: IntersectionObserverInit | undefined;

const MockIntersectionObserver = vi.fn(function (
  _cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
) {
  capturedInit = init;
  return { observe: mockObserve, disconnect: mockDisconnect };
});

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  MockIntersectionObserver.mockClear();
  capturedInit = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useElementVisibility() — reactive options", () => {
  describe("outer Observable replace", () => {
    it("computed$ reflects updated rootMargin when outer Observable changes", () => {
      const options$ = observable({ rootMargin: "0px" });

      const { result } = renderHook(() => {
        const computed$ = useObservable(() => get(options$));
        return { computed$ };
      });

      expect(result.current.computed$.rootMargin.get()).toBe("0px");

      act(() => {
        options$.rootMargin.set("20px");
      });

      // options$.get() was called in reactive context → dep registered
      // → computed$ recomputes when options$ changes
      expect(result.current.computed$.rootMargin.get()).toBe("20px");
    });

    it("computed$ reflects all field changes in outer Observable", () => {
      const options$ = observable({ rootMargin: "0px", threshold: 0 });

      const { result } = renderHook(() => {
        const computed$ = useObservable(() => get(options$));
        return { computed$ };
      });

      act(() => {
        options$.set({ rootMargin: "10px", threshold: 0.5 });
      });

      expect(result.current.computed$.rootMargin.get()).toBe("10px");
      expect(result.current.computed$.threshold.get()).toBe(0.5);
    });

    it("computed$.rootMargin.get() returns plain string — no double-nesting", () => {
      const rootMargin$ = observable("0px");

      const { result } = renderHook(() => {
        const computed$ = useObservable(() =>
          get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ })
        );
        return { computed$ };
      });

      const fieldValue = result.current.computed$.rootMargin.get();
      // Legend-State auto-dereferences: returns plain string, not Observable
      expect(isObservable(fieldValue)).toBe(false);
      expect(fieldValue).toBe("0px");
    });
  });

  describe("per-field Observable", () => {
    it("changing inner Observable does NOT re-evaluate computed$", () => {
      const rootMargin$ = observable("0px");
      let evalCount = 0;

      renderHook(() => {
        useObservable(() => {
          evalCount++;
          // get() on plain object: isObservable = false → returns as-is, no .get() called
          // → rootMargin$ is never called .get() → dep NOT registered
          return get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ });
        });
      });

      const countBeforeChange = evalCount;

      act(() => {
        rootMargin$.set("20px");
      });

      // rootMargin$ not tracked → evalCount unchanged
      expect(evalCount).toBe(countBeforeChange);
    });

    it("inner Observable change IS reflected", () => {
      const rootMargin$ = observable("0px");
      let evalCount = 0;

      const { result } = renderHook(() => {
        const computed$ = useObservable(() => {
          evalCount++;
          return get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ });
        });
        return { computed$ };
      });

      expect(result.current.computed$.rootMargin.get()).toBe("0px");
      const countBeforeChange = evalCount;

      act(() => {
        rootMargin$.set("20px");
      });

      // Legend-State tracks inner Observable fields via field-level dep (NOT callback re-evaluation)
      // → computed$.rootMargin updates to "20px" without re-running the outer callback
      expect(result.current.computed$.rootMargin.get()).toBe("20px");
      expect(evalCount).toBe(countBeforeChange); // outer callback NOT re-run
    });

    it("per-field rootMargin$ change → IntersectionObserver recreated", () => {
      const el = document.createElement("div");
      const rootMargin$ = observable("0px");

      renderHook(() => useElementVisibility(wrapEl(el), { rootMargin: rootMargin$ }));

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(capturedInit?.rootMargin).toBe("0px");

      MockIntersectionObserver.mockClear();
      mockDisconnect.mockClear();

      act(() => {
        rootMargin$.set("20px");
      });

      // opts?.rootMargin = Observable<string> passed through to useIntersectionObserver
      // useIntersectionObserver's useObserve calls get(rootMargin$) → dep registered
      // → rootMargin$ change triggers setup() → IntersectionObserver recreated
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(capturedInit?.rootMargin).toBe("20px");
    });
  });

  describe("outer Observable child-field propagation (scope pattern)", () => {
    it("outer Observable options$.rootMargin child-field set → IO recreated with new rootMargin", () => {
      const el = document.createElement("div");
      const options$ = observable({ rootMargin: "0px" });

      renderHook(() => useElementVisibility(wrapEl(el), options$));

      expect(capturedInit?.rootMargin).toBe("0px");
      MockIntersectionObserver.mockClear();
      mockDisconnect.mockClear();

      act(() => {
        options$.rootMargin.set("20px");
      });

      // Scope-based pattern: `toObs` in the hook wrapper subscribes to each
      // child observable of the outer `options$` and forwards changes into
      // the internal `props$`. The core's linked `opts$` → computed `ioOpts$`
      // → `createIntersectionObserver` chain then recreates the observer.
      //
      // This is a deliberate behavior improvement over the legacy
      // `useToObs` implementation (which had a documented limitation
      // where child-field mutations on outer Observables were ignored).
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(capturedInit?.rootMargin).toBe("20px");
    });
  });
});
