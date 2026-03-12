// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePreferredReducedMotion } from ".";

function createMockMatchMedia(initialMatches = false) {
  const listeners = new Map<string, EventListener[]>();
  let currentMatches = initialMatches;

  const mql = {
    get matches() {
      return currentMatches;
    },
    media: "",
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

  const triggerChange = (matches: boolean) => {
    currentMatches = matches;
    const event = { type: "change", matches } as unknown as MediaQueryListEvent;
    listeners.get("change")?.forEach((l) => l(event));
  };

  return { mockFn: (_query: string) => mql, mql, triggerChange };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePreferredReducedMotion — return value
// ---------------------------------------------------------------------------

describe("usePreferredReducedMotion() — return value", () => {
  it("returns an Observable with .get()", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => usePreferredReducedMotion());
    expect(typeof result.current.get).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// usePreferredReducedMotion — initial value
// ---------------------------------------------------------------------------

describe("usePreferredReducedMotion() — initial value", () => {
  it("returns 'reduce' when prefers-reduced-motion: reduce matches", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(true).mockFn);
    const { result } = renderHook(() => usePreferredReducedMotion());
    expect(result.current.get()).toBe("reduce");
  });

  it("returns 'no-preference' when reduced motion not preferred", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => usePreferredReducedMotion());
    expect(result.current.get()).toBe("no-preference");
  });
});

// ---------------------------------------------------------------------------
// usePreferredReducedMotion — change event
// ---------------------------------------------------------------------------

describe("usePreferredReducedMotion() — change event", () => {
  it("updates when preference changes", () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);

    const { result } = renderHook(() => usePreferredReducedMotion());
    expect(result.current.get()).toBe("no-preference");

    act(() => triggerChange(true));
    expect(result.current.get()).toBe("reduce");
  });
});
