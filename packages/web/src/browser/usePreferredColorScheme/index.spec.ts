// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePreferredColorScheme } from ".";

type QueryState = "dark" | "light" | "none";

function createQueryAwareMockMatchMedia(initialState: QueryState = "none") {
  let currentState: QueryState = initialState;

  // Real browsers return a NEW MediaQueryList instance per matchMedia() call,
  // each with its own listener list. Change events fire on EVERY extant
  // instance for the matching query, so the mock must track all of them and
  // dispatch to each.
  type MqlInstance = {
    query: string;
    listeners: Map<string, EventListener[]>;
  };
  const allMqls: MqlInstance[] = [];

  function getMql(query: string): MediaQueryList {
    const listeners = new Map<string, EventListener[]>();
    allMqls.push({ query, listeners });

    return {
      get matches() {
        if (query === "(prefers-color-scheme: dark)") return currentState === "dark";
        if (query === "(prefers-color-scheme: light)") return currentState === "light";
        return false;
      },
      media: query,
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type)!.push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        const list = listeners.get(type) ?? [];
        const idx = list.indexOf(listener);
        if (idx !== -1) list.splice(idx, 1);
      }),
      dispatchEvent: vi.fn((event: Event) => {
        listeners.get(event.type)?.forEach((l) => l(event));
        return true;
      }),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList;
  }

  const triggerChange = (newState: QueryState) => {
    currentState = newState;
    for (const { query, listeners } of allMqls) {
      const matches =
        (query === "(prefers-color-scheme: dark)" && newState === "dark") ||
        (query === "(prefers-color-scheme: light)" && newState === "light");
      const event = { type: "change", matches } as unknown as MediaQueryListEvent;
      listeners.get("change")?.forEach((l) => l(event));
    }
  };

  return { mockFn: getMql, triggerChange };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePreferredColorScheme — return type
// ---------------------------------------------------------------------------

describe("usePreferredColorScheme() — return type", () => {
  it("returns an Observable with .get()", () => {
    vi.stubGlobal("matchMedia", createQueryAwareMockMatchMedia("none").mockFn);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(typeof result.current.get).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// usePreferredColorScheme — initial value
// ---------------------------------------------------------------------------

describe("usePreferredColorScheme() — initial value", () => {
  it("returns 'dark' when prefers-color-scheme: dark matches", () => {
    vi.stubGlobal("matchMedia", createQueryAwareMockMatchMedia("dark").mockFn);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current.get()).toBe("dark");
  });

  it("returns 'light' when prefers-color-scheme: light matches", () => {
    vi.stubGlobal("matchMedia", createQueryAwareMockMatchMedia("light").mockFn);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current.get()).toBe("light");
  });

  it("returns 'no-preference' when neither matches", () => {
    vi.stubGlobal("matchMedia", createQueryAwareMockMatchMedia("none").mockFn);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current.get()).toBe("no-preference");
  });
});

// ---------------------------------------------------------------------------
// usePreferredColorScheme — change event
// ---------------------------------------------------------------------------

describe("usePreferredColorScheme() — change event", () => {
  it("updates when media query changes from light to dark", () => {
    const { mockFn, triggerChange } = createQueryAwareMockMatchMedia("light");
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => usePreferredColorScheme());
    expect(result.current.get()).toBe("light");

    act(() => triggerChange("dark"));
    expect(result.current.get()).toBe("dark");
  });
});
