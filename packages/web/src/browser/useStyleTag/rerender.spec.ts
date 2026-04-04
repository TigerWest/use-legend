// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useState } from "react";
import { useStyleTag } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll("style[id^='usels_style_']").forEach((el) => el.remove());
  document.head.querySelectorAll("style[id^='rr-']").forEach((el) => el.remove());
});

describe("useStyleTag() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not append a second style element on re-render", () => {
      const { rerender } = renderHook(() => useStyleTag("body {}", { id: "rr-stable" }));

      rerender();

      const els = document.querySelectorAll("style#rr-stable");
      expect(els.length).toBe(1);
    });

    it("does not re-append style when unrelated state changes trigger re-render", () => {
      const appendSpy = vi.spyOn(document.head, "appendChild");

      const { result } = renderHook(() => {
        // eslint-disable-next-line use-legend/prefer-use-observable -- intentional: testing rerender with non-observable state
        const [, setCount] = useState(0);
        const hook = useStyleTag("body {}", { id: "rr-rerender" });
        return { ...hook, setCount };
      });

      const appendCallsAfterMount = appendSpy.mock.calls.length;

      act(() => {
        result.current.setCount((v) => v + 1);
      });

      expect(appendSpy.mock.calls.length).toBe(appendCallsAfterMount);
    });

    it("load() and unload() references are stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useStyleTag("body {}", { manual: true }));

      const loadBefore = result.current.load;
      const unloadBefore = result.current.unload;

      rerender();

      expect(result.current.load).toBe(loadBefore);
      expect(result.current.unload).toBe(unloadBefore);
    });
  });

  describe("value accuracy", () => {
    it("isLoaded$ remains true after re-render", () => {
      const { result, rerender } = renderHook(() => useStyleTag("body {}", { id: "rr-loaded" }));

      expect(result.current.isLoaded$.get()).toBe(true);

      rerender();

      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("css$ retains its value after re-render", () => {
      const { result, rerender } = renderHook(() =>
        useStyleTag("body { color: red; }", { manual: true })
      );

      act(() => {
        result.current.css$.set("body { color: blue; }");
      });

      rerender();

      expect(result.current.css$.get()).toBe("body { color: blue; }");
    });

    it("DOM content remains correct after re-render", () => {
      const { result, rerender } = renderHook(() => useStyleTag("body {}", { id: "rr-dom" }));

      act(() => {
        result.current.css$.set("h1 { font-size: 2rem; }");
      });

      rerender();

      const el = document.getElementById("rr-dom");
      expect(el?.textContent).toBe("h1 { font-size: 2rem; }");
    });
  });
});
