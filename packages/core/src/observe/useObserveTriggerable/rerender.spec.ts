// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useObserveTriggerable } from ".";

describe("useObserveTriggerable() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register observer when unrelated state causes re-render", () => {
      const count$ = observable(0);
      let selectorCallCount = 0;

      const { rerender } = renderHook(
        ({ key: _key }) =>
          useObserveTriggerable(
            () => {
              selectorCallCount++;
              return count$.get();
            },
            () => {}
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
          useObserveTriggerable(
            () => count$.get(),
            () => {
              calls.push(label);
            }
          ),
        { initialProps: { label: "initial" } }
      );

      act(() => {
        count$.set(1);
      });

      rerender({ label: "updated" });

      act(() => {
        count$.set(2);
      });

      expect(calls).toEqual(["initial", "updated"]);
    });

    it("trigger() uses latest effect closure after re-render", () => {
      const count$ = observable(0);
      const calls: string[] = [];

      const { result, rerender } = renderHook(
        ({ label }) =>
          useObserveTriggerable(
            () => count$.get(),
            () => {
              calls.push(label);
            }
          ),
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      act(() => {
        result.current.trigger();
      });

      expect(calls).toEqual(["updated"]);
    });
  });

  describe("stable references", () => {
    it("trigger identity is stable across re-renders", () => {
      const { result, rerender } = renderHook(
        ({ key: _key }) => useObserveTriggerable(() => 0, vi.fn()),
        { initialProps: { key: 0 } }
      );

      const { trigger } = result.current;

      rerender({ key: 1 });

      expect(result.current.trigger).toBe(trigger);
    });

    it("ignoreUpdates identity is stable across re-renders", () => {
      const { result, rerender } = renderHook(
        ({ key: _key }) => useObserveTriggerable(() => 0, vi.fn()),
        { initialProps: { key: 0 } }
      );

      const { ignoreUpdates } = result.current;

      rerender({ key: 1 });

      expect(result.current.ignoreUpdates).toBe(ignoreUpdates);
    });
  });
});
