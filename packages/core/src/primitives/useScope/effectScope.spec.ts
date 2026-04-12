import { describe, it, expect, vi } from "vitest";
import { effectScope, getCurrentScope, onBeforeMount, onMount, onUnmount } from "./effectScope";
import { observable } from "@legendapp/state";

// Each test gets a clean global scope state via the module's internal variable.
// Tests must not leave _currentScope dirty — all scope.run() calls restore it.

describe("effectScope", () => {
  describe("run()", () => {
    it("returns the factory return value", () => {
      const scope = effectScope();
      const result = scope.run(() => 42);
      expect(result).toBe(42);
    });

    it("getCurrentScope() returns the scope during run()", () => {
      const scope = effectScope();
      let capturedScope: ReturnType<typeof getCurrentScope> = null;
      scope.run(() => {
        capturedScope = getCurrentScope();
      });
      expect(capturedScope).toBe(scope);
    });

    it("getCurrentScope() returns null after run() completes", () => {
      const scope = effectScope();
      scope.run(() => {});
      expect(getCurrentScope()).toBeNull();
    });

    it("getCurrentScope() returns null outside any scope", () => {
      expect(getCurrentScope()).toBeNull();
    });

    it("run() on an inactive scope returns undefined safely", () => {
      const scope = effectScope();
      scope.dispose();
      const result = scope.run(() => "should not run");
      expect(result).toBeUndefined();
    });

    it("nested scopes: inner scope is current during inner run()", () => {
      const outer = effectScope();
      const inner = effectScope();
      let outerCaptured: ReturnType<typeof getCurrentScope> = null;
      let innerCaptured: ReturnType<typeof getCurrentScope> = null;

      outer.run(() => {
        outerCaptured = getCurrentScope();
        inner.run(() => {
          innerCaptured = getCurrentScope();
        });
      });

      expect(outerCaptured).toBe(outer);
      expect(innerCaptured).toBe(inner);
    });

    it("nested scopes: outer scope is restored after inner run()", () => {
      const outer = effectScope();
      const inner = effectScope();
      let afterInner: ReturnType<typeof getCurrentScope> = null;

      outer.run(() => {
        inner.run(() => {});
        afterInner = getCurrentScope();
      });

      expect(afterInner).toBe(outer);
    });
  });

  describe("dispose()", () => {
    it("sets active = false", () => {
      const scope = effectScope();
      expect(scope.active).toBe(true);
      scope.dispose();
      expect(scope.active).toBe(false);
    });

    it("duplicate dispose() calls are safe no-ops", () => {
      const scope = effectScope();
      const spy = vi.fn();
      scope.run(() => getCurrentScope()!._addDispose(spy));
      scope.dispose();
      scope.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("calls disposables in reverse registration order", () => {
      const order: number[] = [];
      const scope = effectScope();
      scope.run(() => {
        getCurrentScope()!._addDispose(() => order.push(1));
        getCurrentScope()!._addDispose(() => order.push(2));
        getCurrentScope()!._addDispose(() => order.push(3));
      });
      scope.dispose();
      expect(order).toEqual([3, 2, 1]);
    });

    it("clears disposables after dispose", () => {
      const spy = vi.fn();
      const scope = effectScope();
      scope.run(() => getCurrentScope()!._addDispose(spy));
      scope.dispose();
      scope.dispose(); // second call must not re-run
      expect(spy).toHaveBeenCalledTimes(1);
    });

    describe("nested scope auto-disposal", () => {
      it("parent dispose() calls child dispose()", () => {
        const childSpy = vi.fn();
        const parent = effectScope();
        parent.run(() => {
          const child = effectScope();
          child.run(() => getCurrentScope()!._addDispose(childSpy));
        });
        parent.dispose();
        expect(childSpy).toHaveBeenCalledTimes(1);
      });

      it("child dispose removes itself from parent — parent.dispose() does not call child twice", () => {
        const childSpy = vi.fn();
        const parent = effectScope();
        let child!: ReturnType<typeof effectScope>;
        parent.run(() => {
          child = effectScope();
          child.run(() => getCurrentScope()!._addDispose(childSpy));
        });
        child.dispose(); // dispose child first
        parent.dispose(); // parent should not call child again
        expect(childSpy).toHaveBeenCalledTimes(1);
      });

      it("disposes children before own disposables", () => {
        const order: string[] = [];
        const parent = effectScope();
        parent.run(() => {
          getCurrentScope()!._addDispose(() => order.push("parent-disposable"));
          const child = effectScope();
          child.run(() => getCurrentScope()!._addDispose(() => order.push("child-disposable")));
        });
        parent.dispose();
        // children disposed first (reverse), then parent disposables
        expect(order).toEqual(["child-disposable", "parent-disposable"]);
      });

      it("children disposed in reverse registration order", () => {
        const order: number[] = [];
        const parent = effectScope();
        parent.run(() => {
          const c1 = effectScope();
          c1.run(() => getCurrentScope()!._addDispose(() => order.push(1)));
          const c2 = effectScope();
          c2.run(() => getCurrentScope()!._addDispose(() => order.push(2)));
        });
        parent.dispose();
        expect(order).toEqual([2, 1]);
      });
    });
  });

  describe("onBeforeMount()", () => {
    it("registers callback to _beforeMountCbs inside a scope", () => {
      const cb = vi.fn();
      const scope = effectScope();
      scope.run(() => onBeforeMount(cb));
      expect(scope._beforeMountCbs).toContain(cb);
    });

    it("outside a scope: no-op, no error", () => {
      expect(() => onBeforeMount(() => {})).not.toThrow();
    });

    it("multiple callbacks registered in order", () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const scope = effectScope();
      scope.run(() => {
        onBeforeMount(cb1);
        onBeforeMount(cb2);
      });
      expect(scope._beforeMountCbs).toEqual([cb1, cb2]);
    });
  });

  describe("onMount()", () => {
    it("registers callback to _mountCbs inside a scope", () => {
      const cb = vi.fn();
      const scope = effectScope();
      scope.run(() => onMount(cb));
      expect(scope._mountCbs).toContain(cb);
    });

    it("outside a scope: no-op, no error", () => {
      expect(() => onMount(() => {})).not.toThrow();
    });
  });

  describe("onUnmount()", () => {
    it("registers via onMount — callback is returned as cleanup", () => {
      const cb = vi.fn();
      const scope = effectScope();
      scope.run(() => onUnmount(cb));
      // onUnmount wraps via onMount(() => cb), so _mountCbs has one entry
      expect(scope._mountCbs).toHaveLength(1);
      // calling that mount entry returns the cb as cleanup
      const cleanup = scope._mountCbs[0]();
      expect(cleanup).toBe(cb);
    });

    it("outside a scope: no-op, no error", () => {
      expect(() => onUnmount(() => {})).not.toThrow();
    });
  });

  describe("_observers pause/resume", () => {
    it("_pauseAll calls unsub on every active observer record and clears the handle", () => {
      const scope = effectScope();
      const unsubA = vi.fn();
      const unsubB = vi.fn();
      // direct internal push — observe() migration happens in Task 2
      scope._observers.push({ args: [() => {}], unsub: unsubA });
      scope._observers.push({ args: [() => {}], unsub: unsubB });

      scope._pauseAll();

      expect(unsubA).toHaveBeenCalledTimes(1);
      expect(unsubB).toHaveBeenCalledTimes(1);
      expect(scope._observers[0].unsub).toBeUndefined();
      expect(scope._observers[1].unsub).toBeUndefined();
    });

    it("_pauseAll is idempotent — calling twice does not throw or double-unsub", () => {
      const scope = effectScope();
      const unsub = vi.fn();
      scope._observers.push({ args: [() => {}], unsub });

      scope._pauseAll();
      scope._pauseAll();

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it("_resumeAll re-invokes legendObserve with stored args and stores the new unsub", () => {
      const scope = effectScope();
      const val$ = observable(0);
      const spy = vi.fn();
      // register via internal push — mimic what observe() will do in Task 2
      const record: {
        args: Parameters<typeof import("@legendapp/state").observe>;
        unsub?: () => void;
      } = {
        args: [() => spy(val$.get())],
        unsub: undefined,
      };
      scope._observers.push(record);

      // pause state → resume should create a fresh subscription
      scope._resumeAll();
      expect(typeof record.unsub).toBe("function");

      spy.mockClear();
      val$.set(1);
      expect(spy).toHaveBeenCalledWith(1);
    });

    it("_resumeAll is a no-op on already-active observers (does not double-subscribe)", () => {
      const scope = effectScope();
      const val$ = observable(0);
      const spy = vi.fn();
      const record: {
        args: Parameters<typeof import("@legendapp/state").observe>;
        unsub?: () => void;
      } = {
        args: [() => spy(val$.get())],
        unsub: undefined,
      };
      scope._observers.push(record);
      scope._resumeAll(); // first activation

      spy.mockClear();
      scope._resumeAll(); // second call — must not re-subscribe
      val$.set(1);

      // exactly one subscription → spy fires exactly once for the set
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("dispose() unsubs all observers in reverse order and clears _observers", () => {
      const scope = effectScope();
      const order: string[] = [];
      scope._observers.push({ args: [() => {}], unsub: () => order.push("a") });
      scope._observers.push({ args: [() => {}], unsub: () => order.push("b") });
      scope._observers.push({ args: [() => {}], unsub: () => order.push("c") });

      scope.dispose();

      expect(order).toEqual(["c", "b", "a"]);
      expect(scope._observers).toHaveLength(0);
    });

    it("dispose() drains both _disposables and _observers (observers first, then disposables)", () => {
      const scope = effectScope();
      const order: string[] = [];
      scope.run(() => {
        getCurrentScope()!._addDispose(() => order.push("disposable-1"));
        getCurrentScope()!._addDispose(() => order.push("disposable-2"));
      });
      scope._observers.push({ args: [() => {}], unsub: () => order.push("observer-1") });
      scope._observers.push({ args: [() => {}], unsub: () => order.push("observer-2") });

      scope.dispose();

      // observers reversed, then disposables reversed
      expect(order).toEqual(["observer-2", "observer-1", "disposable-2", "disposable-1"]);
    });

    it("dispose() cascades _pauseAll through children", () => {
      const parent = effectScope();
      const childUnsub = vi.fn();
      parent.run(() => {
        const child = effectScope();
        child._observers.push({ args: [() => {}], unsub: childUnsub });
      });

      parent.dispose();
      expect(childUnsub).toHaveBeenCalledTimes(1);
    });
  });
});
