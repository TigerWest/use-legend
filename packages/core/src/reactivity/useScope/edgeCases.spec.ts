// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import {
  effectScope,
  getCurrentScope,
  onBeforeMount,
  onMount,
  onUnmount,
  onScopeDispose,
} from "./effectScope";
import { observe } from "./observe";
import { useScope, toObs } from ".";

describe("useScope() — edge cases", () => {
  describe("lifecycle hooks outside scope: no-op, no error", () => {
    it("onBeforeMount outside scope does not throw", () => {
      expect(() => onBeforeMount(() => {})).not.toThrow();
    });

    it("onMount outside scope does not throw", () => {
      expect(() => onMount(() => {})).not.toThrow();
    });

    it("onUnmount outside scope does not throw", () => {
      expect(() => onUnmount(() => {})).not.toThrow();
    });

    it("onScopeDispose outside scope does not throw", () => {
      expect(() => onScopeDispose(() => {})).not.toThrow();
    });

    it("observe outside scope behaves as normal legend-state observe", () => {
      const val$ = observable(0);
      const spy = vi.fn();
      const unsub = observe(() => spy(val$.get()));

      expect(spy).toHaveBeenCalledTimes(1);
      act(() => val$.set(1));
      expect(spy).toHaveBeenCalledTimes(2);

      // manual cleanup required (not auto-registered to scope)
      unsub();
      act(() => val$.set(2));
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("empty factory", () => {
    it("useScope with empty factory returns empty object without errors", () => {
      const { result } = renderHook(() => useScope(() => ({})));
      expect(result.current).toEqual({});
    });
  });

  describe("multiple lifecycle hooks mixed", () => {
    it("onBeforeMount, onMount, onUnmount all fire at correct times", () => {
      const order: string[] = [];

      const { unmount } = renderHook(() =>
        useScope(() => {
          onBeforeMount(() => order.push("beforeMount"));
          onMount(() => {
            order.push("mount");
            return () => order.push("mountCleanup");
          });
          onUnmount(() => order.push("unmount"));
          return {};
        })
      );

      expect(order).toEqual(["beforeMount", "mount"]);

      unmount();

      // onUnmount is onMount(() => cb), so it's in the same cleanup queue.
      // Cleanups collected: [mountCleanup-fn, unmount-cb]
      // Reversed on unmount: unmount-cb first, then mountCleanup-fn.
      expect(order).toEqual(["beforeMount", "mount", "unmount", "mountCleanup"]);
    });
  });

  describe("onMount cleanup and onUnmount ordering", () => {
    it("onMount cleanups run in reverse order, then onUnmount callbacks", () => {
      const order: string[] = [];

      const { unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => () => order.push("cleanup-1"));
          onMount(() => () => order.push("cleanup-2"));
          onUnmount(() => order.push("unmount-3"));
          return {};
        })
      );

      unmount();

      // onUnmount is onMount(() => cb) — all in the same cleanup array.
      // Cleanups: [c1-fn, c2-fn, unmount-3-cb] → reversed: [unmount-3, cleanup-2, cleanup-1]
      expect(order).toEqual(["unmount-3", "cleanup-2", "cleanup-1"]);
    });
  });

  describe("nested scopes inside useScope factory", () => {
    it("child effectScope created inside factory is disposed on component unmount", () => {
      const childDispose = vi.fn();

      const { unmount } = renderHook(() =>
        useScope(() => {
          const child = effectScope();
          child.run(() => onScopeDispose(childDispose));
          return {};
        })
      );

      expect(childDispose).not.toHaveBeenCalled();
      unmount();
      expect(childDispose).toHaveBeenCalledTimes(1);
    });
  });

  describe("effectScope — inactive scope guards", () => {
    it("run() on disposed scope returns undefined", () => {
      const scope = effectScope();
      scope.dispose();
      const result = scope.run(() => "value");
      expect(result).toBeUndefined();
    });

    it("_addDispose on disposed scope does not register", () => {
      const spy = vi.fn();
      const scope = effectScope();
      scope.dispose();
      scope._addDispose(spy);
      // even if dispose called again, spy should not fire
      scope.dispose();
      expect(spy).not.toHaveBeenCalled();
    });

    it("getCurrentScope() is null after scope.run() regardless of nesting depth", () => {
      const outer = effectScope();
      outer.run(() => {
        const inner = effectScope();
        inner.run(() => {});
        // after inner run, we're back to outer
        expect(getCurrentScope()).toBe(outer);
      });
      // after outer run, back to null
      expect(getCurrentScope()).toBeNull();
    });
  });

  describe("observe — scope interaction", () => {
    it("multiple observes in one scope all disposed on unmount", () => {
      const a$ = observable(0);
      const b$ = observable(0);
      const spyA = vi.fn();
      const spyB = vi.fn();

      const { unmount } = renderHook(() =>
        useScope(() => {
          observe(() => spyA(a$.get()));
          observe(() => spyB(b$.get()));
          return {};
        })
      );

      unmount();

      act(() => {
        a$.set(1);
        b$.set(1);
      });
      // both spies should not have been called after unmount
      expect(spyA).toHaveBeenCalledTimes(1); // only initial
      expect(spyB).toHaveBeenCalledTimes(1); // only initial
    });
  });
});

describe("useScope() — props edge cases", () => {
  describe("key removal", () => {
    it("removed key sets to undefined in observable", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ props }: { props: Record<string, unknown> }) =>
          useScope((p: any) => {
            const obs$ = toObs(p);
            observe(() => spy(obs$.name?.get?.()));
            return {};
          }, props),
        { initialProps: { props: { name: "alice", extra: 1 } as Record<string, unknown> } }
      );

      rerender({ props: { name: "alice" } as Record<string, unknown> }); // extra removed — should not affect name
      expect(spy).toHaveBeenCalledTimes(1); // name didn't change
    });
  });

  describe("new key added", () => {
    it("adding a new key is readable via raw access", () => {
      let captured: unknown = "initial";
      const { result, rerender } = renderHook(
        ({ props }: { props: Record<string, unknown> }) =>
          useScope(
            (p: any) => ({
              read: () => {
                captured = p.newKey;
              },
            }),
            props
          ),
        { initialProps: { props: { existing: 1 } as Record<string, unknown> } }
      );

      result.current.read();
      expect(captured).toBeUndefined();

      rerender({ props: { existing: 1, newKey: "hello" } as Record<string, unknown> });
      result.current.read();
      expect(captured).toBe("hello");
    });
  });

  describe("proxy stability", () => {
    it("proxy reference (p) is stable across rerenders", () => {
      const refs: object[] = [];
      renderHook(
        ({ count }) =>
          useScope(
            (p: any) => {
              refs.push(p);
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );
      // factory runs once — only one ref captured
      expect(refs).toHaveLength(1);
    });
  });

  describe("toObs not called", () => {
    it("unmount without toObs does not throw", () => {
      const { unmount } = renderHook(({ count }) => useScope((_p: any) => ({}), { count }), {
        initialProps: { count: 0 },
      });
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("empty props", () => {
    it("empty props object does not throw", () => {
      expect(() => {
        renderHook(() => useScope((_p: any) => ({}), {}));
      }).not.toThrow();
    });
  });
});
