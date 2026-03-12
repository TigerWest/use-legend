// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePreferredDark } from ".";

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
    const event = {
      type: "change",
      matches,
    } as unknown as MediaQueryListEvent;
    listeners.get("change")?.forEach((l) => l(event));
  };

  return {
    mockFn: (_query: string) => mql,
    mql,
    triggerChange,
  };
}

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePreferredDark — return type
// ---------------------------------------------------------------------------

describe("usePreferredDark() — return type", () => {
  it("returns an Observable with .get()", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia().mockFn);
    const { result } = renderHook(() => usePreferredDark());
    expect(typeof result.current.get).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// usePreferredDark — initial value
// ---------------------------------------------------------------------------

describe("usePreferredDark() — initial value", () => {
  it("returns false when matchMedia does not match", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => usePreferredDark());
    expect(result.current.get()).toBe(false);
  });

  it("returns true when prefers-color-scheme: dark matches", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(true).mockFn);
    const { result } = renderHook(() => usePreferredDark());
    expect(result.current.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// usePreferredDark — change event
// ---------------------------------------------------------------------------

describe("usePreferredDark() — change event", () => {
  it("updates when media query changes", () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => usePreferredDark());
    expect(result.current.get()).toBe(false);

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// usePreferredDark — cleanup
// ---------------------------------------------------------------------------

describe("usePreferredDark() — cleanup", () => {
  it("does not update after unmount", async () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);

    const { result, unmount } = renderHook(() => usePreferredDark());
    unmount();
    await flush();

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(false);
  });
});
