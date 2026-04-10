// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { isObservable, observe } from "@legendapp/state";
import { useOpaque } from ".";

describe("useOpaque()", () => {
  describe("initial value", () => {
    it("defaults to null", () => {
      const { result } = renderHook(() => useOpaque());
      expect(result.current.get()).toBeNull();
    });

    it("sets initial value correctly", () => {
      const obj = { x: 1, y: 2 };
      const { result } = renderHook(() => useOpaque(obj));
      expect(result.current.get()).toEqual({ x: 1, y: 2 });
    });

    it("returns raw value, not OpaqueObject", () => {
      const obj = { x: 1 };
      const { result } = renderHook(() => useOpaque(obj));
      expect(result.current.get()).toBe(obj);
    });
  });

  describe("set()", () => {
    it("updates the value", () => {
      const { result } = renderHook(() => useOpaque<{ n: number }>());

      act(() => {
        result.current.set({ n: 42 });
      });

      expect(result.current.get()).toEqual({ n: 42 });
    });

    it("returns raw value after set (not OpaqueObject)", () => {
      const obj = { name: "test" };
      const { result } = renderHook(() => useOpaque<typeof obj>());

      act(() => {
        result.current.set(obj);
      });

      expect(result.current.get()).toBe(obj);
    });

    it("accepts null", () => {
      const { result } = renderHook(() => useOpaque({ x: 1 }));

      act(() => {
        result.current.set(null);
      });

      expect(result.current.get()).toBeNull();
    });

    it("triggers onChange listeners", () => {
      const { result } = renderHook(() => useOpaque<{ n: number }>());
      const listener = vi.fn();

      act(() => {
        result.current.onChange(listener);
      });

      act(() => {
        result.current.set({ n: 1 });
      });

      expect(listener).toHaveBeenCalled();
    });

    it("prevents Legend-State from deep-proxying the stored value", () => {
      const obj = { nested: { deep: true } };
      const { result } = renderHook(() => useOpaque(obj));

      const val = result.current.get();
      expect(val).toBe(obj);
      expect(val?.nested).toBe(obj.nested);
    });
  });

  describe("peek()", () => {
    it("returns current value without tracking", () => {
      const obj = { v: 99 };
      const { result } = renderHook(() => useOpaque(obj));
      expect(result.current.peek()).toBe(obj);
    });

    it("returns null when no value set", () => {
      const { result } = renderHook(() => useOpaque());
      expect(result.current.peek()).toBeNull();
    });
  });

  describe("isObservable", () => {
    it("is a proper Observable (isObservable = true)", () => {
      const { result } = renderHook(() => useOpaque({ x: 1 }));
      expect(isObservable(result.current)).toBe(true);
    });
  });

  describe("opaque isolation", () => {
    it("property access on obs$ falls through to legend-state's internal proxy (reads from stored OpaqueObject)", () => {
      const { result } = renderHook(() => useOpaque({ called: 0, nested: { called: 0 } }));
      // Our Proxy delegates unknown props to obs$; legend-state reads the raw property from the OpaqueObject.
      // This is NOT a child observable — it is the raw stored value.
      expect((result.current as any).called).toBe(0);
      expect(isObservable((result.current as any).called)).toBe(false);
      // nested: legend-state does NOT deep-proxy OpaqueObject children
      expect(isObservable((result.current as any).nested)).toBe(false);
    });

    it("direct mutation of get() result does not trigger observers (opaque = no deep tracking)", () => {
      const { result } = renderHook(() => useOpaque({ called: 0, nested: { called: 0 } }));
      const listener = vi.fn();

      act(() => {
        observe(() => {
          result.current.get(); // register dep on obs$
          listener();
        });
      });

      const callsBefore = listener.mock.calls.length;

      act(() => {
        const some = result.current.get()!;
        some.called = 1; // direct mutation — bypasses legend-state tracking
        some.nested.called = 1;
      });

      // observer should NOT have been called again (opaque prevents deep reactivity)
      expect(listener.mock.calls.length).toBe(callsBefore);
    });

    it("calling set() with a new value DOES trigger observers", () => {
      const { result } = renderHook(() => useOpaque({ called: 0, nested: { called: 0 } }));
      const listener = vi.fn();

      act(() => {
        observe(() => {
          result.current.get();
          listener();
        });
      });

      const callsBefore = listener.mock.calls.length;

      act(() => {
        result.current.set({ called: 1, nested: { called: 1 } });
      });

      expect(listener.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe("primitive values", () => {
    it("does not throw when initialized with a number", () => {
      expect(() => renderHook(() => useOpaque(0))).not.toThrow();
    });

    it("get() returns primitive number after init", () => {
      const { result } = renderHook(() => useOpaque(42));
      expect(result.current.get()).toBe(42);
    });

    it("does not throw when set() is called with a number", () => {
      const { result } = renderHook(() => useOpaque(0));
      act(() => {
        result.current.set(1 as unknown as null);
      });
      expect(result.current.get()).toBe(1);
    });

    it("increments correctly when used as a counter", () => {
      const { result } = renderHook(() => useOpaque(0));
      act(() => {
        const next = ((result.current.peek() as unknown as number) ?? 0) + 1;
        result.current.set(next as unknown as null);
      });
      expect(result.current.get()).toBe(1);
    });
  });

  describe("rerender stability", () => {
    it("hook reference is stable across rerenders", () => {
      const { result, rerender } = renderHook(() => useOpaque<{ n: number }>());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });

    it("value is preserved across rerenders", () => {
      const { result, rerender } = renderHook(() => useOpaque<{ n: number }>());

      act(() => {
        result.current.set({ n: 10 });
      });

      rerender();
      expect(result.current.get()).toEqual({ n: 10 });
    });
  });
});
