// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
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

describe("useMediaQuery() — rerender stability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-create MediaQueryList when unrelated state causes re-render", () => {
      const matchMediaSpy = vi.fn(createMockMatchMedia(false).mockFn);
      vi.stubGlobal("matchMedia", matchMediaSpy);

      const { rerender } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      const callsAfterMount = matchMediaSpy.mock.calls.length;

      rerender();
      rerender();
      rerender();

      expect(matchMediaSpy.mock.calls.length).toBe(callsAfterMount);
    });

    it("change event listener count stays at 1 after re-renders", () => {
      const { mockFn, mql } = createMockMatchMedia(false);
      vi.stubGlobal("matchMedia", mockFn);

      const { rerender } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      const countAfterMount = (mql.addEventListener as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([type]: [string]) => type === "change"
      ).length;

      rerender();
      rerender();
      rerender();

      const countAfterRerender = (mql.addEventListener as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([type]: [string]) => type === "change"
      ).length;

      expect(countAfterRerender).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("matches value remains correct after multiple re-renders", () => {
      const { mockFn, triggerChange } = createMockMatchMedia(false);
      vi.stubGlobal("matchMedia", mockFn);

      const { result, rerender } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current.get()).toBe(false);

      act(() => triggerChange(true));
      expect(result.current.get()).toBe(true);

      rerender();
      expect(result.current.get()).toBe(true);

      rerender();
      expect(result.current.get()).toBe(true);
    });
  });
});
