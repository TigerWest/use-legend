// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useObservePausable } from ".";

describe("useObservePausable() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register observer when unrelated state causes re-render", () => {
      const count$ = observable(0);
      let selectorCallCount = 0;

      const { rerender } = renderHook(
        ({ key: _key }) =>
          useObservePausable(
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
          useObservePausable(
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
  });

  describe("state preservation", () => {
    it("isActive$ remains true during re-render", () => {
      const { result, rerender } = renderHook(
        ({ key: _key }) => useObservePausable(() => 0, vi.fn()),
        { initialProps: { key: 0 } }
      );

      rerender({ key: 1 });

      expect(result.current.isActive$.get()).toBe(true);
    });

    it("pause state persists across re-renders", () => {
      const { result, rerender } = renderHook(
        ({ key: _key }) => useObservePausable(() => 0, vi.fn()),
        { initialProps: { key: 0 } }
      );

      act(() => {
        result.current.pause();
      });

      rerender({ key: 1 });

      expect(result.current.isActive$.get()).toBe(false);
    });

    it("pause/resume identity is stable across re-renders", () => {
      const { result, rerender } = renderHook(
        ({ key: _key }) => useObservePausable(() => 0, vi.fn()),
        { initialProps: { key: 0 } }
      );

      const { pause, resume } = result.current;

      rerender({ key: 1 });

      expect(result.current.pause).toBe(pause);
      expect(result.current.resume).toBe(resume);
    });
  });
});
