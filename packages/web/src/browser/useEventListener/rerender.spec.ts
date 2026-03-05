// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useEventListener } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEventListener() — rerender stability", () => {
  // ---------------------------------------------------------------------------
  // resource stability
  // ---------------------------------------------------------------------------

  describe("resource stability", () => {
    it("calls the latest listener after state changes without re-registering", () => {
      const div = document.createElement("div");
      const wrappedDiv = wrapEl(div);
      const addSpy = vi.spyOn(div, "addEventListener");

      const latestListener = vi.fn();

      const { rerender } = renderHook<() => void, { listener: (ev: MouseEvent) => void }>(
        ({ listener }) => useEventListener(wrappedDiv, "click", listener),
        { initialProps: { listener: vi.fn() } }
      );

      const callsBefore = addSpy.mock.calls.length;

      // Simulate re-render with a new listener (e.g. after state change)
      rerender({ listener: latestListener });

      // No additional addEventListener call — forwarder is stable
      expect(addSpy.mock.calls.length).toBe(callsBefore);

      // The latest listener is called when the event fires
      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      expect(latestListener).toHaveBeenCalledOnce();
    });

    it("does not re-register listener when unrelated state causes re-render", () => {
      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");
      const listener = vi.fn();

      const { result } = renderHook(() => {
        // eslint-disable-next-line use-legend/prefer-use-observable -- intentional: testing behavior with non-observable state
        const [, setCount] = useState(0);
        useEventListener(div, "click", listener);
        return { setCount };
      });

      const callsBefore = addSpy.mock.calls.length;

      // Trigger re-render via unrelated state change
      act(() => {
        result.current.setCount((v) => v + 1);
      });

      // addEventListener should not be called again
      expect(addSpy.mock.calls.length).toBe(callsBefore);
    });

    it("addEventListener/removeEventListener call counts do not increase on re-render", () => {
      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");
      const removeSpy = vi.spyOn(div, "removeEventListener");
      const listener = vi.fn();

      const { rerender } = renderHook(({ el }) => useEventListener(el, "click", listener), {
        initialProps: { el: div },
      });

      const addCountAfterMount = addSpy.mock.calls.length;
      const removeCountAfterMount = removeSpy.mock.calls.length;

      // Re-render with same props
      rerender({ el: div });
      rerender({ el: div });

      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
      expect(removeSpy.mock.calls.length).toBe(removeCountAfterMount);
    });

    it("options object recreation on every render does not cause double registration", () => {
      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");
      const listener = vi.fn();

      const { rerender } = renderHook(() =>
        // New object reference on every render
        useEventListener(div, "click", listener, { passive: true })
      );

      const callsBefore = addSpy.mock.calls.length;

      rerender();
      rerender();

      expect(addSpy.mock.calls.length).toBe(callsBefore);
    });
  });

  // ---------------------------------------------------------------------------
  // value accuracy
  // ---------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("reads latest state-captured value when event fires after re-render", () => {
      const div = document.createElement("div");
      const calls: string[] = [];

      const { result } = renderHook(() => {
        // eslint-disable-next-line use-legend/prefer-use-observable -- intentional: testing behavior with non-observable state
        const [value, setValue] = useState("initial");
        useEventListener(div, "click", () => {
          calls.push(value);
        });
        return { setValue };
      });

      act(() => {
        result.current.setValue("updated");
      });

      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      // With forwarder, calls the post-re-render listener that captures "updated"
      expect(calls).toEqual(["updated"]);
    });

    it("listener invokes correctly after re-render (value accuracy)", () => {
      const div = document.createElement("div");
      const received: number[] = [];

      const { result } = renderHook(() => {
        // eslint-disable-next-line use-legend/prefer-use-observable -- intentional: testing behavior with non-observable state
        const [count, setCount] = useState(0);
        useEventListener(div, "click", () => {
          received.push(count);
        });
        return { setCount };
      });

      act(() => result.current.setCount(5));
      act(() => result.current.setCount(10));

      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      // Latest captured value (10) should be used
      expect(received).toEqual([10]);
    });
  });

  // ---------------------------------------------------------------------------
  // stable return references
  // ---------------------------------------------------------------------------

  describe("stable return references", () => {
    it("returned cleanup function identity is stable across re-renders", () => {
      const div = document.createElement("div");
      const listener = vi.fn();

      const { result, rerender } = renderHook(({ el }) => useEventListener(el, "click", listener), {
        initialProps: { el: div },
      });

      const cleanupBefore = result.current;
      rerender({ el: div });
      const cleanupAfter = result.current;

      // The returned cleanup function should be the same reference
      expect(cleanupAfter).toBe(cleanupBefore);
    });
  });

  // ---------------------------------------------------------------------------
  // callback freshness
  // ---------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("latest listener is called after re-render (callback freshness)", () => {
      const div = document.createElement("div");
      const firstListener = vi.fn();
      const secondListener = vi.fn();

      const { rerender } = renderHook(
        ({ listener }: { listener: (e: Event) => void }) =>
          useEventListener(div, "click", listener),
        { initialProps: { listener: firstListener } }
      );

      // Re-render with a new listener
      rerender({ listener: secondListener });

      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      expect(firstListener).not.toHaveBeenCalled();
      expect(secondListener).toHaveBeenCalledOnce();
    });
  });
});
