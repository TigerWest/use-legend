// @vitest-environment jsdom
import React, { useState } from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createProvider } from ".";
import { useScope } from "@primitives/useScope";

describe("createProvider()", () => {
  describe("return type / structure", () => {
    it("returns a readonly tuple of [Provider, useHook, getHook]", () => {
      const result = createProvider(() => 42);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(typeof result[0]).toBe("function");
      expect(typeof result[1]).toBe("function");
      expect(typeof result[2]).toBe("function");
    });
  });

  describe("strict mode (default)", () => {
    it("useContext returns the value provided by Provider", () => {
      const [Provider, useCtx] = createProvider((props: { value: number }) => props.value);
      const { result } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, { value: 99 }, children),
      });
      expect(result.current).toBe(99);
    });

    it("useContext throws when used outside Provider", () => {
      const [, useCtx] = createProvider(() => 42);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useCtx());
      }).toThrow();
      spy.mockRestore();
    });

    it("error message includes displayName", () => {
      const [, useCtx] = createProvider(() => 42, { name: "MyContext" });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useCtx());
      }).toThrow(/MyContext/);
      spy.mockRestore();
    });
  });

  describe("non-strict mode", () => {
    it("useContext returns undefined when used outside Provider", () => {
      const [, useCtx] = createProvider(() => 42, { strict: false });
      const { result } = renderHook(() => useCtx());
      expect(result.current).toBeUndefined();
    });

    it("useContext returns the value when inside Provider", () => {
      const [Provider, useCtx] = createProvider((props: { value: string }) => props.value, {
        strict: false,
      });
      const { result } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, { value: "hello" }, children),
      });
      expect(result.current).toBe("hello");
    });
  });

  describe("options", () => {
    it("name option sets Context.displayName", () => {
      function myComposable() {
        return 1;
      }
      const [Provider] = createProvider(myComposable, { name: "CustomName" });
      expect(Provider.displayName ?? (Provider as any).name).toBeDefined();
    });

    it("defaults displayName to composable.name", () => {
      function namedFn() {
        return 1;
      }
      createProvider(namedFn);
    });

    it("defaults displayName to CreateProvider for anonymous functions", () => {
      createProvider(() => 1);
    });
  });

  describe("composable execution", () => {
    it("composable receives props (excluding children)", () => {
      const composable = vi.fn((props: { x: number; y: string }) => props);
      const [Provider, useCtx] = createProvider(composable);
      renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, { x: 1, y: "a" }, children),
      });
      expect(composable).toHaveBeenCalledWith({ x: 1, y: "a" });
      expect(composable.mock.calls[0]![0]).not.toHaveProperty("children");
    });

    it("composable with no props works with empty Provider", () => {
      const [Provider, useCtx] = createProvider(() => "static");
      const { result } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, {}, children),
      });
      expect(result.current).toBe("static");
    });

    it("composable return value is passed through Context", () => {
      const obj = { a: 1, b: 2 };
      const [Provider, useCtx] = createProvider(() => obj);
      const { result } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, {}, children),
      });
      expect(result.current).toBe(obj);
    });

    it("composable can use React hooks (useState, etc.)", () => {
      const [Provider, useCtx] = createProvider(() => {
        const [count, setCount] = useState(0);
        return { count, setCount };
      });
      const { result } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, {}, children),
      });
      expect(result.current.count).toBe(0);
      expect(typeof result.current.setCount).toBe("function");
    });
  });

  describe("unmount cleanup", () => {
    it("unmounting Provider does not throw", () => {
      const [Provider, useCtx] = createProvider(() => 42);
      const { unmount } = renderHook(() => useCtx(), {
        wrapper: ({ children }) => React.createElement(Provider, {}, children),
      });
      expect(() => unmount()).not.toThrow();
    });
  });
});

describe("createProvider() — getHook (3rd tuple entry)", () => {
  it("getHook returns the provided value when used inside useScope under Provider", () => {
    const [Provider, , getValue] = createProvider((props: { value: number }) => props.value);

    function useCapture() {
      return useScope(() => {
        return { v: getValue() };
      });
    }

    const { result } = renderHook(() => useCapture(), {
      wrapper: ({ children }) => React.createElement(Provider, { value: 7 }, children),
    });

    expect(result.current.v).toBe(7);
  });

  it("getHook throws in strict mode when Provider is missing", () => {
    const [, , getValue] = createProvider(() => 42, { name: "StrictCtx" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function useCapture() {
      return useScope(() => ({ v: getValue() }));
    }

    expect(() => renderHook(() => useCapture())).toThrow(/StrictCtx/);
    spy.mockRestore();
  });

  it("getHook returns undefined in non-strict mode when Provider is missing", () => {
    const [, , getValue] = createProvider(() => 42, { strict: false });

    function useCapture() {
      return useScope(() => ({ v: getValue() }));
    }

    const { result } = renderHook(() => useCapture());
    expect(result.current.v).toBeUndefined();
  });
});
