// @vitest-environment jsdom
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { observable } from "@legendapp/state";
import { createStore, StoreProvider, __resetStoreDefinitions } from ".";

beforeEach(() => {
  __resetStoreDefinitions();
});

describe("createStore() — rerender stability", () => {
  describe("store instance stability", () => {
    it("observable references remain stable across consumer re-renders", () => {
      const useMyStore = createStore("stable-obs", () => {
        const count$ = observable(0);
        return { count$ };
      });

      const { result, rerender } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      const firstRef = result.current.count$;
      rerender();
      const secondRef = result.current.count$;

      expect(firstRef).toBe(secondRef);
    });

    it("plain object store value is stable across re-renders", () => {
      const useMyStore = createStore("stable-ref", () => {
        return { stable: true };
      });

      const { result, rerender } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      const first = result.current;
      rerender();
      const second = result.current;

      expect(first).toBe(second);
    });
  });

  describe("Provider rerender", () => {
    it("store hooks maintain state when parent causes re-render", () => {
      const useMyStore = createStore("parent-rerender", () => {
        const count$ = observable(0);
        const increment = () => count$.set((v) => v + 1);
        return { count$, increment };
      });

      const { result, rerender } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      // Increment the store's count
      act(() => {
        result.current.increment();
      });
      expect(result.current.count$.get()).toBe(1);

      // Trigger re-render (simulates parent state change)
      rerender();

      // Store state should be preserved
      expect(result.current.count$.get()).toBe(1);
    });
  });
});
