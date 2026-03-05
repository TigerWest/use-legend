// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useWindowSize } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function mockMatchMedia(matches = false): (query: string) => MediaQueryList {
  return (_query: string) =>
    ({
      matches,
      media: _query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

describe("useWindowSize() — reactive options", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", mockMatchMedia());

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, "outerWidth", {
      writable: true,
      configurable: true,
      value: 1100,
    });
    Object.defineProperty(window, "outerHeight", {
      writable: true,
      configurable: true,
      value: 850,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      writable: true,
      configurable: true,
      value: 740,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
    it("type change via re-render triggers immediate re-measurement without resize event", async () => {
      const { result, rerender } = renderHook(
        (props: { type: "inner" | "outer" | "visual" }) =>
          useWindowSize({ type: props.type }),
        { initialProps: { type: "inner" as "inner" | "outer" | "visual" } }
      );

      expect(result.current.width.get()).toBe(1024);
      expect(result.current.height.get()).toBe(768);

      await act(async () => {
        rerender({ type: "outer" });
        await flush();
      });

      expect(result.current.width.get()).toBe(1100);
      expect(result.current.height.get()).toBe(850);
    });

    it("type as Observable → reactive re-measurement when Observable value changes", async () => {
      const type$ = observable<"inner" | "outer" | "visual">("inner");

      const { result } = renderHook(() => useWindowSize({ type: type$ }));

      // Initial: 'inner' → reads innerWidth/innerHeight
      expect(result.current.width.get()).toBe(1024);
      expect(result.current.height.get()).toBe(768);

      // Change Observable value — useObserveEffect tracks opts$.type.get() → re-measurement
      await act(async () => {
        type$.set("outer");
        await flush();
      });

      expect(result.current.width.get()).toBe(1100);
      expect(result.current.height.get()).toBe(850);
    });

    it("includeScrollbar change via re-render triggers immediate re-measurement without resize event", async () => {
      const { result, rerender } = renderHook(
        (props: { includeScrollbar: boolean }) =>
          useWindowSize({ includeScrollbar: props.includeScrollbar }),
        { initialProps: { includeScrollbar: true } }
      );

      // includeScrollbar: true → reads innerWidth/innerHeight
      expect(result.current.width.get()).toBe(1024);
      expect(result.current.height.get()).toBe(768);

      await act(async () => {
        rerender({ includeScrollbar: false });
        await flush();
      });

      // includeScrollbar: false → reads clientWidth/clientHeight
      expect(result.current.width.get()).toBe(1000);
      expect(result.current.height.get()).toBe(740);
    });

    it("includeScrollbar as Observable → reactive re-measurement when Observable value changes", async () => {
      const includeScrollbar$ = observable(true);

      const { result } = renderHook(() =>
        useWindowSize({ includeScrollbar: includeScrollbar$ })
      );

      // Initial: true → reads innerWidth/innerHeight
      expect(result.current.width.get()).toBe(1024);
      expect(result.current.height.get()).toBe(768);

      await act(async () => {
        includeScrollbar$.set(false);
        await flush();
      });

      // After change: false → reads clientWidth/clientHeight
      expect(result.current.width.get()).toBe(1000);
      expect(result.current.height.get()).toBe(740);
    });
  });
});
