// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { useScope, onMount, onBeforeMount, onUnmount, createObserve, toObs } from ".";

/**
 * React Strict Mode (dev) runs:
 *   render → layoutEffect → effect → [cleanup] → layoutEffect → effect
 *
 * With the scope.active check in useScope, the factory re-runs on the second mount.
 * These tests verify that reactivity is fully restored after the Strict Mode remount.
 */
describe("useScope() — React Strict Mode", () => {
  const wrapper = StrictMode;

  describe("factory re-execution", () => {
    it("factory runs exactly once in Strict Mode", () => {
      const factory = vi.fn(() => ({}));
      renderHook(() => useScope(factory), { wrapper });
      // factory-once contract: Strict Mode simulated remount does NOT re-run the factory
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("factory runs exactly once in non-Strict Mode", () => {
      const factory = vi.fn(() => ({}));
      renderHook(() => useScope(factory));
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe("createObserve() reactivity after Strict Mode remount", () => {
    it("observe callback reacts to changes after Strict Mode remount", () => {
      const count$ = observable(0);
      const spy = vi.fn();

      renderHook(
        () =>
          useScope(() => {
            createObserve(() => spy(count$.get()));
            return {};
          }),
        { wrapper }
      );

      // After Strict Mode settle: spy has been called at least once (initial)
      spy.mockClear();

      act(() => count$.set(1));
      expect(spy).toHaveBeenCalledWith(1);
    });

    it("observe callback is NOT called after unmount (no stale subscription)", () => {
      const val$ = observable("a");
      const spy = vi.fn();

      const { unmount } = renderHook(
        () =>
          useScope(() => {
            createObserve(() => spy(val$.get()));
            return {};
          }),
        { wrapper }
      );

      unmount();
      spy.mockClear();

      act(() => val$.set("b"));
      expect(spy).not.toHaveBeenCalled();
    });

    it("multiple observes all reactive after Strict Mode remount", () => {
      const a$ = observable(0);
      const b$ = observable(0);
      const spyA = vi.fn();
      const spyB = vi.fn();

      renderHook(
        () =>
          useScope(() => {
            createObserve(() => spyA(a$.get()));
            createObserve(() => spyB(b$.get()));
            return {};
          }),
        { wrapper }
      );

      spyA.mockClear();
      spyB.mockClear();

      act(() => {
        a$.set(1);
        b$.set(2);
      });
      expect(spyA).toHaveBeenCalledWith(1);
      expect(spyB).toHaveBeenCalledWith(2);
    });
  });

  describe("factory-local observables — regression for pre-factory-once bug", () => {
    it("observable created inside the factory stays reactive after Strict Mode remount", () => {
      const spy = vi.fn();

      const { result } = renderHook(
        () =>
          useScope(() => {
            const count$ = observable(0);
            createObserve(() => spy(count$.get()));
            return { count$ };
          }),
        { wrapper }
      );

      // After Strict Mode settle: returned count$ is the SAME instance the observer tracks
      spy.mockClear();
      act(() => result.current.count$.set(7));

      expect(spy).toHaveBeenCalledWith(7);
    });
  });

  describe("lifecycle callbacks", () => {
    it("onBeforeMount fires twice in Strict Mode (once per mount)", () => {
      const spy = vi.fn();
      renderHook(
        () =>
          useScope(() => {
            onBeforeMount(spy);
            return {};
          }),
        { wrapper }
      );
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("onMount fires twice in Strict Mode (once per mount)", () => {
      const spy = vi.fn();
      renderHook(
        () =>
          useScope(() => {
            onMount(spy);
            return {};
          }),
        { wrapper }
      );
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("onUnmount fires once on actual unmount after Strict Mode", () => {
      const spy = vi.fn();
      const { unmount } = renderHook(
        () =>
          useScope(() => {
            onUnmount(spy);
            return {};
          }),
        { wrapper }
      );

      // Strict Mode fires cleanup once (simulated), then a real unmount
      // The simulated cleanup + real unmount = spy called twice total
      spy.mockClear();
      unmount();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("onMount cleanup (return value) fires on actual unmount", () => {
      const cleanup = vi.fn();
      const { unmount } = renderHook(
        () =>
          useScope(() => {
            onMount(() => cleanup);
            return {};
          }),
        { wrapper }
      );

      cleanup.mockClear();
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("rerender stability after Strict Mode settle", () => {
    it("factory does not re-run on re-renders after Strict Mode settle", () => {
      const factory = vi.fn(() => ({}));
      const { rerender } = renderHook(() => useScope(factory), { wrapper });

      const callsAfterMount = factory.mock.calls.length; // 2 in Strict Mode
      rerender();
      rerender();
      expect(factory).toHaveBeenCalledTimes(callsAfterMount);
    });

    it("observe still stable (not re-registered) on re-renders after Strict Mode", () => {
      const val$ = observable(0);
      const spy = vi.fn();

      const { rerender } = renderHook(
        () =>
          useScope(() => {
            createObserve(() => spy(val$.get()));
            return {};
          }),
        { wrapper }
      );

      spy.mockClear();
      rerender();
      rerender();

      // No extra calls from re-renders
      expect(spy).toHaveBeenCalledTimes(0);

      // But still reactive
      act(() => val$.set(99));
      expect(spy).toHaveBeenCalledWith(99);
    });
  });

  describe("props path — Strict Mode", () => {
    it("props factory re-runs in Strict Mode, observe still reactive", () => {
      const spy = vi.fn();

      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              createObserve(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { wrapper, initialProps: { count: 0 } }
      );

      spy.mockClear();

      // prop change should still trigger observe after Strict Mode settle
      act(() => rerender({ count: 5 }));
      expect(spy).toHaveBeenCalledWith(5);
    });

    it("raw prop access reflects latest value after Strict Mode remount", () => {
      let captured = -1;
      const { result, rerender } = renderHook(
        ({ value }) =>
          useScope(
            (p) => ({
              read: () => {
                captured = p.value;
              },
            }),
            { value }
          ),
        { wrapper, initialProps: { value: 0 } }
      );

      rerender({ value: 42 });
      result.current.read();
      expect(captured).toBe(42);
    });

    it("per-field Observable prop propagates child mutations after Strict Mode remount", () => {
      const val$ = observable(0);
      const spy = vi.fn();

      renderHook(
        () =>
          useScope(
            (p) => {
              const p$ = toObs(p);
              createObserve(() => spy(p$.val.get()));
              return {};
            },
            { val: val$ }
          ),
        { wrapper }
      );

      spy.mockClear();
      act(() => val$.set(42));
      expect(spy).toHaveBeenCalledWith(42);
    });

    it("props path onMount cleanup fires on actual unmount after Strict Mode", () => {
      const cleanup = vi.fn();
      const { unmount } = renderHook(
        ({ count }) =>
          useScope(
            (_p: any) => {
              onMount(() => cleanup);
              return {};
            },
            { count }
          ),
        { wrapper, initialProps: { count: 0 } }
      );

      cleanup.mockClear();
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });
});

describe("multi-params — Strict Mode", () => {
  it("multi-params factory re-runs in Strict Mode, observe still reactive", () => {
    const spy = vi.fn();

    const { rerender } = renderHook(
      ({ debounce, name }) =>
        useScope(
          (timing, _opts) => {
            const t$ = toObs(timing);
            createObserve(() => spy(t$.debounce.get()));
            return {};
          },
          { debounce },
          { name }
        ),
      { wrapper: StrictMode, initialProps: { debounce: 100, name: "x" } }
    );

    spy.mockClear();
    act(() => rerender({ debounce: 500, name: "x" }));
    expect(spy).toHaveBeenCalledWith(500);
  });
});
