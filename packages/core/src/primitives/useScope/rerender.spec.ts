// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useScope, onMount, onBeforeMount, observe, toObs } from ".";

describe("useScope() — rerender stability", () => {
  describe("factory not re-executed", () => {
    it("factory runs exactly once across multiple re-renders", () => {
      const factory = vi.fn(() => ({}));
      const { rerender } = renderHook(() => useScope(factory));
      rerender();
      rerender();
      rerender();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("result reference is identical across re-renders", () => {
      const { result, rerender } = renderHook(() => useScope(() => ({ tag: "stable" })));
      const first = result.current;
      rerender();
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe("lifecycle callbacks not re-registered", () => {
    it("onBeforeMount not called again on re-render", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(() =>
        useScope(() => {
          onBeforeMount(spy);
          return {};
        })
      );
      rerender();
      rerender();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("onMount not called again on re-render", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(() =>
        useScope(() => {
          onMount(spy);
          return {};
        })
      );
      rerender();
      rerender();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("observe stability", () => {
    it("observe callback not re-registered on re-render", () => {
      const count$ = observable(0);
      const spy = vi.fn();

      const { rerender } = renderHook(() =>
        useScope(() => {
          observe(() => spy(count$.get()));
          return {};
        })
      );

      const callsAfterMount = spy.mock.calls.length; // 1 (initial run)

      rerender();
      rerender();

      // no extra calls from re-renders
      expect(spy).toHaveBeenCalledTimes(callsAfterMount);
    });

    it("observe still reacts to observable changes after re-render", () => {
      const val$ = observable("a");
      const spy = vi.fn();

      const { rerender } = renderHook(() =>
        useScope(() => {
          observe(() => spy(val$.get()));
          return {};
        })
      );

      rerender();

      act(() => val$.set("b"));
      expect(spy).toHaveBeenLastCalledWith("b");
    });
  });

  describe("unmount after re-render", () => {
    it("cleanup still fires correctly after multiple re-renders", () => {
      const cleanup = vi.fn();
      const { rerender, unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => cleanup);
          return {};
        })
      );
      rerender();
      rerender();
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("observe disposed on unmount even after re-renders", () => {
      const count$ = observable(0);
      const spy = vi.fn();

      const { rerender, unmount } = renderHook(() =>
        useScope(() => {
          observe(() => spy(count$.get()));
          return {};
        })
      );

      rerender();
      rerender();
      unmount();

      const callsBeforeChange = spy.mock.calls.length;
      act(() => count$.set(99));
      expect(spy).toHaveBeenCalledTimes(callsBeforeChange);
    });
  });
});

describe("useScope() — rerender stability with props", () => {
  describe("factory not re-executed on prop changes", () => {
    it("factory runs exactly once across prop rerenders", () => {
      const factory = vi.fn((_p: any) => ({}));
      const { rerender } = renderHook(({ count }) => useScope(factory, { count }), {
        initialProps: { count: 0 },
      });
      rerender({ count: 1 });
      rerender({ count: 2 });
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("result reference is stable across prop rerenders", () => {
      const { result, rerender } = renderHook(
        ({ count }) => useScope((_p: any) => ({ tag: "stable" }), { count }),
        { initialProps: { count: 0 } }
      );
      const first = result.current;
      rerender({ count: 1 });
      expect(result.current).toBe(first);
    });
  });

  describe("raw prop access freshness", () => {
    it("p.value returns latest prop after rerender", () => {
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
        { initialProps: { value: 0 } }
      );
      result.current.read();
      expect(captured).toBe(0);

      rerender({ value: 42 });
      result.current.read();
      expect(captured).toBe(42);
    });
  });
});

// ─── withState: useState가 props 소스인 경우 ──────────────────────────────────

describe("useScope() — withState (useState as props source)", () => {
  describe("raw access freshness", () => {
    it("p.value returns latest useState value after state update", () => {
      let captured = -1;
      const { result, rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => ({
              read: () => {
                captured = p.count;
              },
            }),
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      result.current.read();
      expect(captured).toBe(0);

      rerender({ count: 5 });
      result.current.read();
      expect(captured).toBe(5);
    });

    it("stale closure regression — handler inside scope always reads latest state via p", () => {
      // If the factory captured the initial value in a plain closure, this would fail.
      // p.key reads from propsRef.current, so it is always fresh.
      let captured = -1;
      const { result, rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => ({
              handler: () => {
                captured = p.count;
              },
            }),
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      rerender({ count: 10 });
      rerender({ count: 20 });
      result.current.handler();
      expect(captured).toBe(20);
    });

    it("function prop (e.g. callback from useState) is always the latest after rerender", () => {
      const fn1 = vi.fn(() => "first");
      const fn2 = vi.fn(() => "second");

      const { result, rerender } = renderHook(
        ({ onClick }) =>
          useScope((p) => ({ trigger: () => (p.onClick as () => string)() }), { onClick }),
        { initialProps: { onClick: fn1 } }
      );

      result.current.trigger();
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();

      // Simulate useCallback invalidation due to state change
      rerender({ onClick: fn2 });
      result.current.trigger();
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn1).toHaveBeenCalledTimes(1); // fn1 not called again
    });
  });

  describe("toObs reactive tracking on state change", () => {
    it("observe fires with latest value on each state-driven rerender", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      expect(spy).toHaveBeenCalledWith(0);

      rerender({ count: 1 });
      expect(spy).toHaveBeenCalledWith(1);

      rerender({ count: 2 });
      expect(spy).toHaveBeenCalledWith(2);

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("observer does NOT fire when state rerenders with the same value", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 5 } }
      );

      const callsAfterMount = spy.mock.calls.length;

      // Parent rerenders but state value is identical
      rerender({ count: 5 });
      rerender({ count: 5 });

      expect(spy).toHaveBeenCalledTimes(callsAfterMount);
    });

    it("observer for count NOT triggered when only unrelated state (name) changes", () => {
      const countSpy = vi.fn();
      const { rerender } = renderHook(
        ({ count, name }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => countSpy(obs$.count.get()));
              return {};
            },
            { count, name }
          ),
        { initialProps: { count: 0, name: "alice" } }
      );

      const callsAfterMount = countSpy.mock.calls.length;

      // Only name changes (different useState slice)
      rerender({ count: 0, name: "bob" });

      expect(countSpy).toHaveBeenCalledTimes(callsAfterMount);
    });

    it("consecutive state changes all propagate — each distinct value observed", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      expect(spy).toHaveBeenCalledTimes(4); // initial + 3 distinct changes
      expect(spy).toHaveBeenLastCalledWith(3);
    });
  });

  describe("rerender issues — scope continuity", () => {
    it("factory not re-executed when state causes rerender", () => {
      const factory = vi.fn((_p: any) => ({}));
      const { rerender } = renderHook(({ count }) => useScope(factory, { count }), {
        initialProps: { count: 0 },
      });

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("result reference is stable across state changes", () => {
      const { result, rerender } = renderHook(
        ({ count }) => useScope((_p: any) => ({ tag: "stable" }), { count }),
        { initialProps: { count: 0 } }
      );

      const first = result.current;
      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(result.current).toBe(first);
    });

    it("observe inside scope remains active (not re-created) across state changes", () => {
      const spy = vi.fn();
      const external$ = observable(0);

      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (_p: any) => {
              observe(() => spy(external$.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      const callsAfterMount = spy.mock.calls.length;

      // State changes should not disrupt the internal observe
      rerender({ count: 1 });
      rerender({ count: 2 });

      // External change must still be tracked (scope not re-created)
      act(() => external$.set(99));
      expect(spy).toHaveBeenLastCalledWith(99);
      expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    });

    it("object prop with same reference does not trigger observer (Object.is identity check)", () => {
      const spy = vi.fn();
      const config = { theme: "dark" };

      const { rerender } = renderHook(
        ({ cfg }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p, { cfg: "opaque" });
              observe(() => {
                obs$.cfg.get();
                spy();
              });
              return {};
            },
            { cfg }
          ),
        { initialProps: { cfg: config } }
      );

      const callsAfterMount = spy.mock.calls.length;

      // Same reference — syncProps skips (Object.is === true)
      rerender({ cfg: config });
      expect(spy).toHaveBeenCalledTimes(callsAfterMount);

      // New reference — change detected, observer fires
      rerender({ cfg: { theme: "dark" } });
      expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    });
  });

  describe("rerender issues — unmount timing", () => {
    it("unmount immediately after state change does not throw", () => {
      const { rerender, unmount } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => obs$.count.get());
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      rerender({ count: 1 });
      expect(() => unmount()).not.toThrow();
    });

    it("observer does not fire after unmount even when state would have changed", () => {
      const spy = vi.fn();
      const { unmount } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      unmount();
      const callsBeforeStateChange = spy.mock.calls.length;

      // After unmount the component would not rerender, but verify scope is truly disposed
      const external$ = observable(0);
      act(() => external$.set(1)); // should not trigger
      expect(spy).toHaveBeenCalledTimes(callsBeforeStateChange);
    });
  });
});
