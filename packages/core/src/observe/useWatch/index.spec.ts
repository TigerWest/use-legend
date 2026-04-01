// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, batch } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useWatch, watch } from ".";

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

    describe("schedule", () => {
      it("schedule: 'sync' — does not fire on mount (still lazy)", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { schedule: "sync" }));
        expect(effect).not.toHaveBeenCalled();
      });

      it("schedule: 'deferred' — does not fire on mount (still lazy)", () => {
        const count$ = observable(0);
        const effect = vi.fn();
        renderHook(() => useWatch(count$, effect, { schedule: "deferred" }));
        expect(effect).not.toHaveBeenCalled();
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

describe("watch() — core schedule behavior", () => {
  it("schedule: 'sync' — fires synchronously inside batch (before endBatch)", () => {
    const count$ = observable(0);
    const calls: number[] = [];
    const { dispose } = watch(count$, (v) => calls.push(v), { schedule: "sync" });

    batch(() => {
      count$.set(1);
      // immediate: true — fires within the batch callback, not deferred
      expect(calls).toEqual([1]);
      count$.set(2);
      expect(calls).toEqual([1, 2]);
    });

    dispose();
  });

  it("schedule: 'deferred' — defers until batch ends", () => {
    const count$ = observable(0);
    const calls: number[] = [];
    const { dispose } = watch(count$, (v) => calls.push(v), { schedule: "deferred" });

    batch(() => {
      count$.set(1);
      expect(calls).toEqual([]); // not fired yet — deferred until batch ends
      count$.set(2);
      expect(calls).toEqual([]); // still deferred
    });

    // batch completed — deferred observer fires once with latest value
    expect(calls).toEqual([2]);
    dispose();
  });

  it("schedule: 'sync' with immediate: true — fires on subscribe and synchronously inside batch", () => {
    const count$ = observable(0);
    const calls: number[] = [];
    const { dispose } = watch(count$, (v) => calls.push(v), { immediate: true, schedule: "sync" });

    expect(calls).toEqual([0]); // fires on subscribe

    batch(() => {
      count$.set(5);
      expect(calls).toEqual([0, 5]); // synchronous inside batch
    });

    dispose();
  });

  it("dispose — stops receiving updates", () => {
    const count$ = observable(0);
    const effect = vi.fn();
    const { dispose } = watch(count$, effect);

    dispose();
    batch(() => {
      count$.set(1);
    });

    expect(effect).not.toHaveBeenCalled();
  });
});
