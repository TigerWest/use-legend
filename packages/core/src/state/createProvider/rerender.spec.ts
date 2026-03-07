// @vitest-environment jsdom
import React, { useState, useEffect } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createProvider } from ".";

describe("createProvider() — rerender stability", () => {
  describe("Provider rerender", () => {
    it("composable is re-called with new props on Provider re-render", () => {
      const [Provider, useCtx] = createProvider((props: { count: number }) => props.count);

      const controlRef: { setCount?: (v: number) => void } = {};

      function Wrapper({ children }: { children: React.ReactNode }) {
        const [count, setCount] = useState(1);
        // eslint-disable-next-line use-legend/prefer-use-observe -- pure React Context test, no observables
        useEffect(() => {
          controlRef.setCount = setCount;
        }, []);
        return React.createElement(Provider, { count }, children);
      }

      const { result } = renderHook(() => useCtx(), { wrapper: Wrapper });

      expect(result.current).toBe(1);

      act(() => {
        controlRef.setCount!(2);
      });

      expect(result.current).toBe(2);
    });

    it("useContext consumer receives updated value after Provider re-render", () => {
      const [Provider, useCtx] = createProvider((props: { label: string }) => props.label);

      const controlRef: { setLabel?: (v: string) => void } = {};

      function Wrapper({ children }: { children: React.ReactNode }) {
        const [label, setLabel] = useState("first");
        // eslint-disable-next-line use-legend/prefer-use-observe -- pure React Context test, no observables
        useEffect(() => {
          controlRef.setLabel = setLabel;
        }, []);
        return React.createElement(Provider, { label }, children);
      }

      const { result } = renderHook(() => useCtx(), { wrapper: Wrapper });

      expect(result.current).toBe("first");

      act(() => {
        controlRef.setLabel!("second");
      });

      expect(result.current).toBe("second");
    });
  });

  describe("consumer rerender", () => {
    it("useContext returns same value reference when consumer re-renders without Provider change", () => {
      const obj = { stable: true };
      const [Provider, useCtx] = createProvider(() => obj);

      const { result, rerender } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, {}, children),
      });

      const first = result.current;
      rerender();
      const second = result.current;

      expect(first).toBe(second);
    });
  });
});
