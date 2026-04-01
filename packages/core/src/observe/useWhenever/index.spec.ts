// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useWhenever, whenever } from ".";

describe("useWhenever()", () => {
  describe("lazy behavior", () => {
    it("does not call effect on mount by default", () => {
      const flag$ = observable(true);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect));
      expect(effect).not.toHaveBeenCalled();
    });

    it("does not call effect on mount when value is falsy", () => {
      const flag$ = observable(false);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { immediate: true }));
      expect(effect).not.toHaveBeenCalled();
    });
  });

  describe("truthy gate", () => {
    it("calls effect when value becomes truthy", () => {
      const flag$ = observable(false);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect));

      act(() => {
        flag$.set(true);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(true);
    });

    it("does not call effect when value stays falsy", () => {
      const value$ = observable<string | null>(null);
      const effect = vi.fn();
      renderHook(() => useWhenever(() => value$.get(), effect));

      act(() => {
        value$.set(null);
      });
      act(() => {
        value$.set(undefined as unknown as null);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("does not call effect when value becomes falsy", () => {
      const flag$ = observable(true);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect));

      act(() => {
        flag$.set(false);
      });

      expect(effect).not.toHaveBeenCalled();
    });

    it("calls effect only on truthy transitions", () => {
      const flag$ = observable(false);
      const calls: boolean[] = [];
      renderHook(() => useWhenever(flag$, (v) => calls.push(v)));

      act(() => {
        flag$.set(true);
      });
      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(calls).toEqual([true, true]);
    });
  });

  describe("immediate: true", () => {
    it("calls effect on mount if value is truthy", () => {
      const flag$ = observable(true);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { immediate: true }));
      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(true);
    });

    it("does not call effect on mount if value is falsy", () => {
      const flag$ = observable(false);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { immediate: true }));
      expect(effect).not.toHaveBeenCalled();
    });

    it("calls effect on mount and again on truthy change", () => {
      const flag$ = observable(true);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { immediate: true }));

      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(effect).toHaveBeenCalledTimes(2);
    });
  });

  describe("once option", () => {
    it("calls effect only once when value becomes truthy", () => {
      const flag$ = observable(false);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { once: true }));

      act(() => {
        flag$.set(true);
      });
      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(effect).toHaveBeenCalledTimes(1);
    });

    it("once + immediate: calls once on mount if truthy, no more after that", () => {
      const flag$ = observable(true);
      const effect = vi.fn();
      renderHook(() => useWhenever(flag$, effect, { immediate: true, once: true }));

      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("function selector", () => {
    it("calls effect with computed truthy value", () => {
      const name$ = observable<string | null>(null);
      const effect = vi.fn();
      renderHook(() => useWhenever(() => name$.get(), effect));

      act(() => {
        name$.set("Alice");
      });

      expect(effect).toHaveBeenCalledWith("Alice");
    });
  });

  describe("latest closure", () => {
    it("always uses the latest effect reference", () => {
      const flag$ = observable(false);
      const results: number[] = [];

      const { rerender } = renderHook(
        ({ multiplier }) =>
          useWhenever(flag$, (v) => {
            results.push(v ? multiplier : 0);
          }),
        { initialProps: { multiplier: 1 } }
      );

      act(() => {
        flag$.set(true);
      });
      rerender({ multiplier: 3 });
      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(results).toEqual([1, 3]);
    });
  });

  describe("unmount cleanup", () => {
    it("stops calling effect after unmount", () => {
      const flag$ = observable(false);
      const effect = vi.fn();

      const { unmount } = renderHook(() => useWhenever(flag$, effect));
      unmount();

      act(() => {
        flag$.set(true);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });
});

describe("whenever() — core", () => {
  it("does not call effect until value is truthy (lazy)", () => {
    const flag$ = observable(false);
    const effect = vi.fn();
    const { dispose } = whenever(flag$, effect);

    flag$.set(false);
    expect(effect).not.toHaveBeenCalled();

    flag$.set(true);
    expect(effect).toHaveBeenCalledTimes(1);

    dispose();
  });

  it("once: true — stops after first truthy call", () => {
    const flag$ = observable(false);
    const effect = vi.fn();
    const { dispose } = whenever(flag$, effect, { once: true });

    flag$.set(true);
    flag$.set(false);
    flag$.set(true);

    expect(effect).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("dispose — stops receiving updates", () => {
    const flag$ = observable(false);
    const effect = vi.fn();
    const { dispose } = whenever(flag$, effect);

    dispose();
    flag$.set(true);

    expect(effect).not.toHaveBeenCalled();
  });

  it("immediate: true — fires on subscribe if value is truthy", () => {
    const flag$ = observable(true);
    const effect = vi.fn();
    const { dispose } = whenever(flag$, effect, { immediate: true });

    expect(effect).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("immediate: true — does not fire if value is falsy", () => {
    const flag$ = observable(false);
    const effect = vi.fn();
    const { dispose } = whenever(flag$, effect, { immediate: true });

    expect(effect).not.toHaveBeenCalled();
    dispose();
  });
});
