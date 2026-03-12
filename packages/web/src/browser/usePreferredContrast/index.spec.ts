// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePreferredContrast } from ".";

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
// usePreferredContrast — return value
// ---------------------------------------------------------------------------

describe("usePreferredContrast() — return value", () => {
  it("returns an Observable with .get()", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => usePreferredContrast());
    expect(typeof result.current.get).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// usePreferredContrast — initial value
// ---------------------------------------------------------------------------

describe("usePreferredContrast() — initial value", () => {
  it("returns 'more' when prefers-contrast: more matches", () => {
    const mockFn = (query: string) => {
      const matches = query === "(prefers-contrast: more)";
      const mql = createMockMatchMedia(matches);
      return mql.mql;
    };
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => usePreferredContrast());
    expect(result.current.get()).toBe("more");
  });

  it("returns 'less' when prefers-contrast: less matches", () => {
    const mockFn = (query: string) => {
      const matches = query === "(prefers-contrast: less)";
      const mql = createMockMatchMedia(matches);
      return mql.mql;
    };
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => usePreferredContrast());
    expect(result.current.get()).toBe("less");
  });

  it("returns 'custom' when prefers-contrast: custom matches", () => {
    const mockFn = (query: string) => {
      const matches = query === "(prefers-contrast: custom)";
      const mql = createMockMatchMedia(matches);
      return mql.mql;
    };
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => usePreferredContrast());
    expect(result.current.get()).toBe("custom");
  });

  it("returns 'no-preference' when no contrast preference matches", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => usePreferredContrast());
    expect(result.current.get()).toBe("no-preference");
  });
});

// ---------------------------------------------------------------------------
// usePreferredContrast — change event
// ---------------------------------------------------------------------------

describe("usePreferredContrast() — change event", () => {
  it("updates when contrast preference changes", () => {
    const triggerMap = new Map<string, ReturnType<typeof createMockMatchMedia>>();

    const mockFn = (query: string) => {
      if (!triggerMap.has(query)) {
        triggerMap.set(query, createMockMatchMedia(false));
      }
      return triggerMap.get(query)!.mql;
    };
    vi.stubGlobal("matchMedia", mockFn);

    const { result } = renderHook(() => usePreferredContrast());
    expect(result.current.get()).toBe("no-preference");

    act(() => {
      triggerMap.get("(prefers-contrast: more)")?.triggerChange(true);
    });
    expect(result.current.get()).toBe("more");
  });
});
