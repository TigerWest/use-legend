// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { bypassFilter } from "@shared/filters";
import { useObserveWithFilter } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useObserveWithFilter() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register observer when unrelated state causes re-render", () => {
      const count$ = observable(0);
      let selectorCallCount = 0;

      const { rerender } = renderHook(
        ({ key: _key }) =>
          useObserveWithFilter(
            () => {
              selectorCallCount++;
              return count$.get();
            },
            () => {},
            { eventFilter: bypassFilter }
          ),
        { initialProps: { key: 0 } }
      );

      const callsAfterMount = selectorCallCount;

      rerender({ key: 1 });
      rerender({ key: 2 });

      expect(selectorCallCount).toBe(callsAfterMount);

      act(() => {
        count$.set(1);
      });

      expect(selectorCallCount).toBe(callsAfterMount + 1);
    });
  });

  describe("callback freshness", () => {
    it("uses latest effect closure after re-render", () => {
      const count$ = observable(0);
      const calls: string[] = [];

      const { rerender } = renderHook(
        ({ label }) =>
          useObserveWithFilter(
            () => count$.get(),
            (value) => {
              calls.push(`${label}:${value}`);
            },
            { eventFilter: bypassFilter }
          ),
        { initialProps: { label: "a" } }
      );

      act(() => {
        count$.set(1);
      });

      rerender({ label: "b" });

      act(() => {
        count$.set(2);
      });

      expect(calls).toEqual(["a:1", "b:2"]);
    });
  });

  describe("value accuracy", () => {
    it("reactive updates remain accurate after re-render", () => {
      const val$ = observable("initial");
      const seen: string[] = [];

      const { rerender } = renderHook(() =>
        useObserveWithFilter(
          () => val$.get(),
          (value) => {
            seen.push(value);
          },
          { eventFilter: bypassFilter }
        )
      );

      rerender();

      act(() => {
        val$.set("updated");
      });

      expect(seen).toContain("updated");
    });
  });
});
