// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { observable } from "@legendapp/state";
import { useInitialPick } from ".";

interface TestOptions {
  type?: "page" | "client" | "screen";
  touch?: boolean;
  delay?: number;
  label?: string;
}

describe("useInitialPick()", () => {
  describe("initial values", () => {
    it("returns Observable values at mount with defaults applied", () => {
      const opts$ = observable<TestOptions>({ type: "client", touch: false });
      const { result } = renderHook(() =>
        useInitialPick(opts$, { type: "page" as const, touch: true, delay: 100 })
      );

      expect(result.current.type).toBe("client");
      expect(result.current.touch).toBe(false);
      expect(result.current.delay).toBe(100); // fallback applied
    });

    it("returns fallback when field is undefined", () => {
      const opts$ = observable<TestOptions>({});
      const { result } = renderHook(() =>
        useInitialPick(opts$, { type: "page" as const, touch: true })
      );

      expect(result.current.type).toBe("page");
      expect(result.current.touch).toBe(true);
    });

    it("returns fallback when field is null", () => {
      const opts$ = observable<TestOptions>({ type: null as any });
      const { result } = renderHook(() => useInitialPick(opts$, { type: "page" as const }));

      expect(result.current.type).toBe("page");
    });
  });

  describe("falsy value preservation", () => {
    it("preserves false (not replaced by fallback)", () => {
      const opts$ = observable<TestOptions>({ touch: false });
      const { result } = renderHook(() => useInitialPick(opts$, { touch: true }));

      expect(result.current.touch).toBe(false);
    });

    it("preserves 0 (not replaced by fallback)", () => {
      const opts$ = observable<TestOptions>({ delay: 0 });
      const { result } = renderHook(() => useInitialPick(opts$, { delay: 999 }));

      expect(result.current.delay).toBe(0);
    });

    it("preserves empty string (not replaced by fallback)", () => {
      const opts$ = observable<TestOptions>({ label: "" });
      const { result } = renderHook(() => useInitialPick(opts$, { label: "default" }));

      expect(result.current.label).toBe("");
    });
  });

  describe("mount-time stability", () => {
    it("does NOT update when Observable changes after mount", () => {
      const opts$ = observable<TestOptions>({ type: "client", touch: true });
      const { result } = renderHook(() =>
        useInitialPick(opts$, { type: "page" as const, touch: false })
      );

      expect(result.current.type).toBe("client");
      expect(result.current.touch).toBe(true);

      act(() => {
        opts$.type.set("screen");
        opts$.touch.set(false);
      });

      // Values remain captured at mount
      expect(result.current.type).toBe("client");
      expect(result.current.touch).toBe(true);
    });

    it("returns the same object reference across re-renders", () => {
      const opts$ = observable<TestOptions>({ type: "client" });
      const { result, rerender } = renderHook(() =>
        useInitialPick(opts$, { type: "page" as const, touch: true })
      );

      const first = result.current;
      rerender();
      const second = result.current;

      expect(first).toBe(second); // same reference
    });

    it("does NOT re-peek on re-render (value stays mount-time snapshot)", () => {
      const opts$ = observable<TestOptions>({ type: "client" });

      const { result, rerender } = renderHook(() =>
        useInitialPick(opts$, { type: "page" as const })
      );

      // Change observable after mount
      act(() => opts$.type.set("screen"));

      rerender();
      rerender();

      // Still returns mount-time value, proving no re-peek occurred
      expect(result.current.type).toBe("client");
    });
  });

  describe("multiple fields", () => {
    it("picks all specified fields in one call", () => {
      const opts$ = observable<TestOptions>({
        type: "screen",
        touch: false,
        delay: 50,
        label: "test",
      });

      const { result } = renderHook(() =>
        useInitialPick(opts$, {
          type: "page" as const,
          touch: true,
          delay: 100,
          label: "default",
        })
      );

      expect(result.current).toEqual({
        type: "screen",
        touch: false,
        delay: 50,
        label: "test",
      });
    });

    it("mixes present and missing fields correctly", () => {
      const opts$ = observable<TestOptions>({ type: "client" });

      const { result } = renderHook(() =>
        useInitialPick(opts$, {
          type: "page" as const,
          touch: true,
          delay: 200,
        })
      );

      expect(result.current.type).toBe("client"); // from observable
      expect(result.current.touch).toBe(true); // fallback
      expect(result.current.delay).toBe(200); // fallback
    });
  });
});
