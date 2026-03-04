// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounced } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounced() — edge cases", () => {
  it("ms=0 — updates synchronously without delay", () => {
    const source$ = observable("initial");

    const { result } = renderHook(() => useDebounced(source$, 0));

    // debounceFilter skips the timer path when ms <= 0 and calls invoke() directly
    act(() => {
      source$.set("immediate");
    });

    // With ms=0, update must be visible within the same act() — no timer needed
    expect(result.current.get()).toBe("immediate");
  });

  it("source changes to same value — debounced$ remains stable", () => {
    const source$ = observable("hello");

    const { result } = renderHook(() => useDebounced(source$, 300));

    // Complete the initial debounce cycle so debounced$ is in sync
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.get()).toBe("hello");

    const changeCount = { value: 0 };
    result.current.onChange(() => {
      changeCount.value += 1;
    });

    // Set source to the same value — Legend-State may skip reactivity entirely
    act(() => {
      source$.set("hello");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // debounced$ must not have fired an unnecessary notification
    expect(result.current.get()).toBe("hello");
    expect(changeCount.value).toBe(0);
  });

  it("rapid source changes — intermediate values never appear in debounced$", () => {
    const source$ = observable("initial");

    const { result } = renderHook(() => useDebounced(source$, 300));

    const seen: string[] = [];
    result.current.onChange((value) => {
      seen.push(value.value as string);
    });

    // Fire multiple source changes rapidly within a single act block
    act(() => {
      source$.set("a");
      source$.set("b");
      source$.set("c");
      source$.set("d");
    });

    // Before timer fires — debounced$ must still hold the initial value
    expect(result.current.get()).toBe("initial");
    expect(seen).toEqual([]);

    // Advance past the debounce window — only the final value should appear
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.get()).toBe("d");
    // Only the final settled value must have triggered a notification
    expect(seen).toEqual(["d"]);
    // Intermediate values must never have appeared
    expect(seen).not.toContain("a");
    expect(seen).not.toContain("b");
    expect(seen).not.toContain("c");
  });
});
