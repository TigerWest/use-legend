// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { observable } from "@legendapp/state";
import { usePeekInitial } from ".";

describe("usePeekInitial() — with fallback", () => {
  it("returns the Observable's value at mount", () => {
    const obs$ = observable<boolean | undefined>(true);
    const { result } = renderHook(() => usePeekInitial(obs$, false));
    expect(result.current).toBe(true);
  });

  it("returns fallback when obs.peek() is undefined", () => {
    const obs$ = observable<boolean | undefined>(undefined);
    const { result } = renderHook(() => usePeekInitial(obs$, false));
    expect(result.current).toBe(false);
  });

  it("returns fallback when obs.peek() is null", () => {
    const obs$ = observable<string | null | undefined>(null);
    const { result } = renderHook(() => usePeekInitial(obs$ as any, "default"));
    expect(result.current).toBe("default");
  });

  it("does NOT update when the Observable changes after mount", () => {
    const obs$ = observable<string | undefined>("initial");
    const { result } = renderHook(() => usePeekInitial(obs$, "fallback"));
    expect(result.current).toBe("initial");

    act(() => {
      obs$.set("changed");
    });

    expect(result.current).toBe("initial");
  });

  it("does NOT re-peek on re-render (stable reference, peek called once)", () => {
    const obs$ = observable<number | undefined>(42);
    const peekSpy = vi.spyOn(obs$, "peek");

    const { rerender } = renderHook(() => usePeekInitial(obs$, 0));
    const callsAfterMount = peekSpy.mock.calls.length;

    rerender();
    rerender();

    // peek() should not have been called again after mount
    expect(peekSpy.mock.calls.length).toBe(callsAfterMount);
    peekSpy.mockRestore();
  });

  it("union type: returns correct union member at mount", () => {
    const obs$ = observable<"requestAnimationFrame" | number | undefined>(1000);
    const { result } = renderHook(() => usePeekInitial(obs$, "requestAnimationFrame" as const));
    expect(result.current).toBe(1000);
  });

  it("union type: returns fallback string when obs is undefined", () => {
    const obs$ = observable<"requestAnimationFrame" | number | undefined>(undefined);
    const { result } = renderHook(() => usePeekInitial(obs$, "requestAnimationFrame" as const));
    expect(result.current).toBe("requestAnimationFrame");
  });
});

describe("usePeekInitial() — without fallback", () => {
  it("returns the Observable's value when present", () => {
    const obs$ = observable<number | undefined>(99);
    const { result } = renderHook(() => usePeekInitial(obs$));
    expect(result.current).toBe(99);
  });

  it("returns undefined when obs.peek() is undefined", () => {
    const obs$ = observable<number | undefined>(undefined);
    const { result } = renderHook(() => usePeekInitial(obs$));
    expect(result.current).toBeUndefined();
  });

  it("does NOT update when the Observable changes after mount", () => {
    const obs$ = observable<string | undefined>("first");
    const { result } = renderHook(() => usePeekInitial(obs$));

    act(() => {
      obs$.set("second");
    });

    expect(result.current).toBe("first");
  });
});

describe("usePeekInitial() — falsy initial values", () => {
  it("preserves false as initial value (not replaced by fallback)", () => {
    const obs$ = observable<boolean | undefined>(false);
    const { result } = renderHook(() => usePeekInitial(obs$, true));
    expect(result.current).toBe(false);
  });

  it("preserves 0 as initial value (not replaced by fallback)", () => {
    const obs$ = observable<number | undefined>(0);
    const { result } = renderHook(() => usePeekInitial(obs$, 999));
    expect(result.current).toBe(0);
  });

  it("preserves empty string as initial value (not replaced by fallback)", () => {
    const obs$ = observable<string | undefined>("");
    const { result } = renderHook(() => usePeekInitial(obs$, "default"));
    // "" is falsy but not nullish — ?? does not trigger, so "" is preserved
    expect(result.current).toBe("");
  });
});
