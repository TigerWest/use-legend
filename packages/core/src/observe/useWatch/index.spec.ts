// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useWatch } from ".";

describe("useWatch()", () => {
  describe("lazy behavior — does not fire on mount", () => {
    it("does not call effect on mount with single observable", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(count$, effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("does not call effect on mount with function selector", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(() => count$.get(), effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("does not call effect on mount with array selector", () => {
      const a$ = observable(0);
      const b$ = observable("x");
      const effect = vi.fn();
      renderHook(() => useWatch([a$, b$], effect));
      expect(effect).not.toHaveBeenCalled();
    });
  });

  describe("single observable selector", () => {
    it("calls effect when observable changes after mount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(count$, effect));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(1);
    });

    it("passes updated value on each change", () => {
      const count$ = observable(0);
      const values: number[] = [];
      renderHook(() => useWatch(count$, (v) => values.push(v)));

      act(() => {
        count$.set(10);
      });
      act(() => {
        count$.set(20);
      });

      expect(values).toEqual([10, 20]);
    });
  });

  describe("function selector", () => {
    it("calls effect when tracked observable changes", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(() => count$.get(), effect));

      act(() => {
        count$.set(5);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(5);
    });

    it("passes selector return value (computed) to effect", () => {
      const count$ = observable(2);
      const effect = vi.fn();
      renderHook(() => useWatch(() => count$.get() * 10, effect));

      act(() => {
        count$.set(3);
      });

      expect(effect).toHaveBeenCalledWith(30);
    });
  });

  describe("array selector", () => {
    it("calls effect with array of values when any observable changes", () => {
      const a$ = observable(1);
      const b$ = observable("hello");
      const effect = vi.fn();
      renderHook(() => useWatch([a$, b$], effect));

      act(() => {
        a$.set(2);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith([2, "hello"]);
    });

    it("reflects latest values of all observables on each change", () => {
      const a$ = observable(1);
      const b$ = observable(10);
      const results: number[][] = [];
      renderHook(() => useWatch([a$, b$], (v) => results.push(v as number[])));

      act(() => {
        a$.set(2);
      });
      act(() => {
        b$.set(20);
      });

      expect(results).toEqual([
        [2, 10],
        [2, 20],
      ]);
    });
  });

  describe("options", () => {
    it("immediate: true — calls effect on mount", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(count$, effect, { immediate: true }));
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(0);
    });

    it("immediate: true — also calls effect on change", () => {
      const count$ = observable(0);
      const effect = vi.fn();
      renderHook(() => useWatch(count$, effect, { immediate: true }));

      act(() => {
        count$.set(1);
      });

      expect(effect).toHaveBeenCalledTimes(2);
      expect(effect).toHaveBeenLastCalledWith(1);
    });

    describe("flush", () => {
      it("flush: 'pre' — does not fire on mount (still lazy)", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { flush: "pre" }));
        expect(effect).not.toHaveBeenCalled();
      });

      it("flush: 'post' — does not fire on mount (still lazy)", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { flush: "post" }));
        expect(effect).not.toHaveBeenCalled();
      });

      it("flush: 'pre' — fires effect synchronously when observable changes", () => {
        const count$ = observable(0);
        const calls: number[] = [];
        renderHook(() => useWatch(count$, (v) => calls.push(v), { flush: "pre" }));

        count$.set(1);
        // flush: 'pre' maps to Legend-State immediate: true — fires without waiting for batch
        expect(calls).toEqual([1]);
      });

      it("flush: 'pre' — passes correct value", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { flush: "pre" }));

        act(() => {
          count$.set(42);
        });

        expect(effect).toHaveBeenCalledWith(42);
      });

      it("flush: 'post' — fires effect after batch", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { flush: "post" }));

        act(() => {
          count$.set(1);
        });

        expect(effect).toHaveBeenCalledTimes(1);
        expect(effect).toHaveBeenCalledWith(1);
      });

      it("flush: 'pre' with immediate: true — fires on mount and on change", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { immediate: true, flush: "pre" }));
        expect(effect).toHaveBeenCalledTimes(1);

        count$.set(1);
        expect(effect).toHaveBeenCalledTimes(2);
        expect(effect).toHaveBeenLastCalledWith(1);
      });
    });
  });

  describe("latest closure", () => {
    it("always uses the latest effect reference", () => {
      const count$ = observable(0);
      const results: string[] = [];

      const { rerender } = renderHook(
        ({ label }) =>
          useWatch(
            () => count$.get(),
            () => {
              results.push(label);
            }
          ),
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      act(() => {
        count$.set(1);
      });

      expect(results).toEqual(["updated"]);
    });
  });

  describe("unmount cleanup", () => {
    it("does not call effect after unmount", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      const { unmount } = renderHook(() => useWatch(count$, effect));
      unmount();

      act(() => {
        count$.set(1);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("does not throw after unmount", () => {
      const count$ = observable(0);
      const { unmount } = renderHook(() => useWatch(count$, vi.fn()));
      unmount();

      expect(() => {
        act(() => {
          count$.set(1);
        });
      }).not.toThrow();
    });
  });
});
