// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useMediaQuery } from ".";

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

describe("useMediaQuery() — reactive options", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
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
});
