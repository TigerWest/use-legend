// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useMediaQuery, evaluateSSRQuery } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
// TODO: change to e2e
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useMediaQuery — return value
// ---------------------------------------------------------------------------

describe("useMediaQuery() — return value", () => {
  it("returns an Observable", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia().mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(typeof result.current.get).toBe("function");
  });

  it("returns false when matchMedia is not supported", () => {
    const win = globalThis.window as any;
    const original = win.matchMedia;
    delete win.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(false);

    win.matchMedia = original;
  });
});

// ---------------------------------------------------------------------------
// useMediaQuery — client initial value
// ---------------------------------------------------------------------------

describe("useMediaQuery() — client initial value", () => {
  it("initial value is true when matchMedia matches", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(true).mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(true);
  });

  it("initial value is false when matchMedia does not match", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(false).mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useMediaQuery — change event
// ---------------------------------------------------------------------------

describe("useMediaQuery() — change event", () => {
  it("updates to true on change event", () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(false);

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(true);
  });

  it("updates to false on change event", () => {
    const { mockFn, triggerChange } = createMockMatchMedia(true);
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(true);

    act(() => triggerChange(false));
    expect(result.current.get()).toBe(false);
  });

  it("toggles correctly across multiple change events", () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(true);

    act(() => triggerChange(false));
    expect(result.current.get()).toBe(false);

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useMediaQuery — SSR (evaluateSSRQuery)
// ---------------------------------------------------------------------------

describe("useMediaQuery() — SSR (evaluateSSRQuery)", () => {
  it("min-width satisfied", () => {
    expect(evaluateSSRQuery("(min-width: 768px)", 1024)).toBe(true);
  });

  it("min-width not satisfied", () => {
    expect(evaluateSSRQuery("(min-width: 768px)", 500)).toBe(false);
  });

  it("max-width satisfied", () => {
    expect(evaluateSSRQuery("(max-width: 768px)", 500)).toBe(true);
  });

  it("max-width not satisfied", () => {
    expect(evaluateSSRQuery("(max-width: 768px)", 1024)).toBe(false);
  });

  it("not all negation", () => {
    expect(evaluateSSRQuery("not all and (min-width: 768px)", 500)).toBe(true);
  });

  it("comma-separated queries match when one condition is met", () => {
    expect(evaluateSSRQuery("(max-width: 500px), (min-width: 768px)", 1024)).toBe(true);
  });

  it("defaults to false when no ssrWidth is provided", () => {
    const win = globalThis.window as any;
    const original = win.matchMedia;
    delete win.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current.get()).toBe(false);

    win.matchMedia = original;
  });

  it("query without min/max-width resolves to false", () => {
    expect(evaluateSSRQuery("(prefers-color-scheme: dark)", 1024)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useMediaQuery — cleanup
// ---------------------------------------------------------------------------

describe("useMediaQuery() — cleanup", () => {
  it("removes change listener on unmount", async () => {
    const { mockFn, mql } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    await flush();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
  });

  it("does not update after unmount", async () => {
    const { mockFn, triggerChange } = createMockMatchMedia(false);
    vi.stubGlobal("matchMedia", mockFn);

    const { result, unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    await flush();

    act(() => triggerChange(true));
    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useMediaQuery — reactive query (MaybeObservable<string>)
// ---------------------------------------------------------------------------

describe("useMediaQuery() — reactive query (MaybeObservable<string>)", () => {
  it("accepts Observable<string> and reads initial value", () => {
    vi.stubGlobal("matchMedia", createMockMatchMedia(true).mockFn);
    const query$ = observable("(min-width: 768px)");

    const { result } = renderHook(() => useMediaQuery(query$));
    expect(result.current.get()).toBe(true);
  });

  it("updates matches when query Observable changes", () => {
    const mqlMap = new Map<string, ReturnType<typeof createMockMatchMedia>>();
    vi.stubGlobal("matchMedia", (q: string) => {
      if (!mqlMap.has(q)) mqlMap.set(q, createMockMatchMedia(q === "(max-width: 480px)"));
      return mqlMap.get(q)!.mql;
    });

    const query$ = observable("(min-width: 1024px)");
    const { result } = renderHook(() => useMediaQuery(query$));
    expect(result.current.get()).toBe(false);

    act(() => query$.set("(max-width: 480px)"));
    expect(result.current.get()).toBe(true);
  });

  it("removes old change listener and adds new one when query changes", () => {
    const mqlMap = new Map<string, ReturnType<typeof createMockMatchMedia>>();
    vi.stubGlobal("matchMedia", (q: string) => {
      if (!mqlMap.has(q)) mqlMap.set(q, createMockMatchMedia(false));
      return mqlMap.get(q)!.mql;
    });

    const query$ = observable("(min-width: 1024px)");
    renderHook(() => useMediaQuery(query$));

    act(() => query$.set("(max-width: 480px)"));

    expect(mqlMap.get("(min-width: 1024px)")!.mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
    expect(mqlMap.get("(max-width: 480px)")!.mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
      { passive: true }
    );
  });
});
