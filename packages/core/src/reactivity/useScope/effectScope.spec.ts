import { describe, it, expect, vi } from "vitest";
import {
  effectScope,
  getCurrentScope,
  onScopeDispose,
  onBeforeMount,
  onMount,
  onUnmount,
} from "./effectScope";

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
      scope.run(() => onScopeDispose(spy));
      scope.dispose();
      scope.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("calls disposables in reverse registration order", () => {
      const order: number[] = [];
      const scope = effectScope();
      scope.run(() => {
        onScopeDispose(() => order.push(1));
        onScopeDispose(() => order.push(2));
        onScopeDispose(() => order.push(3));
      });
      scope.dispose();
      expect(order).toEqual([3, 2, 1]);
    });

    it("clears disposables after dispose", () => {
      const spy = vi.fn();
      const scope = effectScope();
      scope.run(() => onScopeDispose(spy));
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
          child.run(() => onScopeDispose(childSpy));
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
          child.run(() => onScopeDispose(childSpy));
        });
        child.dispose(); // dispose child first
        parent.dispose(); // parent should not call child again
        expect(childSpy).toHaveBeenCalledTimes(1);
      });

      it("disposes children before own disposables", () => {
        const order: string[] = [];
        const parent = effectScope();
        parent.run(() => {
          onScopeDispose(() => order.push("parent-disposable"));
          const child = effectScope();
          child.run(() => onScopeDispose(() => order.push("child-disposable")));
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
          c1.run(() => onScopeDispose(() => order.push(1)));
          const c2 = effectScope();
          c2.run(() => onScopeDispose(() => order.push(2)));
        });
        parent.dispose();
        expect(order).toEqual([2, 1]);
      });
    });
  });

  describe("onScopeDispose()", () => {
    it("registers callback and calls it on dispose()", () => {
      const spy = vi.fn();
      const scope = effectScope();
      scope.run(() => onScopeDispose(spy));
      expect(spy).not.toHaveBeenCalled();
      scope.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("outside a scope: no-op, no error", () => {
      expect(() => onScopeDispose(() => {})).not.toThrow();
    });

    it("does not register when scope is already inactive", () => {
      const spy = vi.fn();
      const scope = effectScope();
      scope.dispose();
      scope._addDispose(spy); // direct call to verify _addDispose also guards
      expect(spy).not.toHaveBeenCalled();
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
});
