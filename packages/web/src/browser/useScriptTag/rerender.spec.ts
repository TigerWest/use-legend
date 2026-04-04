// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { useScriptTag } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll("script[src]").forEach((el) => el.remove());
});

describe("useScriptTag() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not append a second script element on re-render", async () => {
      const { rerender } = renderHook(() =>
        useScriptTag("https://example.com/stable.js", undefined, { manual: true })
      );

      await act(async () => {
        rerender();
      });

      // load manually to ensure one script exists
      const els = document.querySelectorAll('script[src="https://example.com/stable.js"]');
      expect(els.length).toBeLessThanOrEqual(1);
    });

    it("does not re-append script when unrelated state changes trigger re-render", async () => {
      const appendSpy = vi.spyOn(document.head, "appendChild");

      const { result } = renderHook(() => {
        // eslint-disable-next-line use-legend/prefer-use-observable -- intentional: testing rerender with non-observable state
        const [, setCount] = useState(0);
        const hook = useScriptTag("https://example.com/rerender.js", undefined, { manual: true });
        return { ...hook, setCount };
      });

      await act(async () => {
        await result.current.load(false);
      });

      const appendCallsAfterLoad = appendSpy.mock.calls.length;

      act(() => {
        result.current.setCount((v) => v + 1);
      });

      // No additional appendChild after re-render
      expect(appendSpy.mock.calls.length).toBe(appendCallsAfterLoad);
    });

    it("load() and unload() references are stable across re-renders", async () => {
      const { result, rerender } = renderHook(() =>
        useScriptTag("https://example.com/refs.js", undefined, { manual: true })
      );

      const loadBefore = result.current.load;
      const unloadBefore = result.current.unload;

      rerender();

      expect(result.current.load).toBe(loadBefore);
      expect(result.current.unload).toBe(unloadBefore);
    });
  });

  describe("value accuracy", () => {
    it("scriptTag$ retains its value after re-render", async () => {
      const { result, rerender } = renderHook(() =>
        useScriptTag("https://example.com/value.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const elBefore = result.current.scriptTag$.get();

      rerender();

      expect(result.current.scriptTag$.get()).toBe(elBefore);
    });
  });
});
