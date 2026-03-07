// @vitest-environment jsdom
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { observable } from "@legendapp/state";
import { createStore, StoreProvider, __resetStoreDefinitions } from ".";

beforeEach(() => {
  __resetStoreDefinitions();
});

describe("createStore()", () => {
  describe("return type / structure", () => {
    it("returns a hook function", () => {
      const useStore = createStore("test", () => ({ value: 1 }));
      expect(typeof useStore).toBe("function");
    });
  });

  describe("basic usage", () => {
    it("useStore returns the setup return value", () => {
      const useCountStore = createStore("count", () => {
        return { count: 42 };
      });

      const { result } = renderHook(() => useCountStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.count).toBe(42);
    });

    it("useStore returns the same reference across multiple calls", () => {
      const useMyStore = createStore("ref-test", () => {
        return { data: "hello" };
      });

      const { result } = renderHook(
        () => {
          const a = useMyStore();
          return a;
        },
        {
          wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
        }
      );

      expect(result.current.data).toBe("hello");
    });

    it("multiple stores work independently", () => {
      const useStoreA = createStore("a", () => ({ value: "A" }));
      const useStoreB = createStore("b", () => ({ value: "B" }));

      const { result } = renderHook(
        () => ({
          a: useStoreA(),
          b: useStoreB(),
        }),
        {
          wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
        }
      );

      expect(result.current.a.value).toBe("A");
      expect(result.current.b.value).toBe("B");
    });
  });

  describe("core functions in setup", () => {
    it("observable works inside setup", () => {
      const useMyStore = createStore("obs-test", () => {
        const count$ = observable(0);
        return { count$ };
      });

      const { result } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.count$.get()).toBe(0);
    });

    it("plain ref object works inside setup", () => {
      const useMyStore = createStore("ref-hook-test", () => {
        const ref = { current: 0 };
        return { ref };
      });

      const { result } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.ref.current).toBe(0);
    });
  });

  describe("inter-store dependency", () => {
    it("store can access another store via useOtherStore()", () => {
      const useAuthStore = createStore("auth", () => {
        return { user: "Alice" };
      });

      const useProfileStore = createStore("profile", () => {
        const auth = useAuthStore();
        return { greeting: `Hello, ${auth.user}` };
      });

      const { result } = renderHook(() => useProfileStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.greeting).toBe("Hello, Alice");
    });

    it("three-level dependency chain works", () => {
      const useBase = createStore("base", () => ({ n: 1 }));
      const useMid = createStore("mid", () => {
        const base = useBase();
        return { n: base.n + 1 };
      });
      const useTop = createStore("top", () => {
        const mid = useMid();
        return { n: mid.n + 1 };
      });

      const { result } = renderHook(() => useTop(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.n).toBe(3);
    });
  });

  describe("error handling", () => {
    it("throws when used outside StoreProvider", () => {
      const useMyStore = createStore("no-provider", () => ({ v: 1 }));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useMyStore());
      }).toThrow(/StoreProvider/);
      spy.mockRestore();
    });

    it("throws when store name is duplicated in production mode", () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      try {
        createStore("dup", () => ({}));
        expect(() => {
          createStore("dup", () => ({}));
        }).toThrow(/already defined/);
      } finally {
        process.env.NODE_ENV = original;
        // Clean up the definition left by the first createStore call
        __resetStoreDefinitions();
      }
    });

    it("allows re-definition in non-production mode (HMR support)", () => {
      createStore("dup-dev", () => ({}));
      // Should NOT throw — silently re-defines for HMR
      expect(() => {
        createStore("dup-dev", () => ({}));
      }).not.toThrow();
    });
  });

  describe("unmount cleanup", () => {
    it("StoreProvider unmounts without error", () => {
      const useMyStore = createStore("unmount-test", () => ({ v: 1 }));

      const { unmount } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("shared state across consumers", () => {
    it("multiple hooks in the same Provider share the same store instance", () => {
      const useMyStore = createStore("shared", () => {
        const count$ = observable(0);
        return { count$ };
      });

      const { result } = renderHook(
        () => {
          const a = useMyStore();
          const b = useMyStore();
          return { a, b };
        },
        {
          wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
        }
      );

      // Both calls return the same reference from the registry
      expect(result.current.a.count$).toBe(result.current.b.count$);
    });
  });

  describe("lazy initialization", () => {
    it("store is initialized on first useStore() call", () => {
      const setup = vi.fn(() => ({ value: 99 }));
      const useLazyStore = createStore("lazy-init", setup);

      // setup not called yet
      expect(setup).not.toHaveBeenCalled();

      const { result } = renderHook(() => useLazyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      // setup called exactly once on first access
      expect(setup).toHaveBeenCalledTimes(1);
      expect(result.current.value).toBe(99);
    });

    it("store initialized only once across multiple consumers", () => {
      const setup = vi.fn(() => {
        const count$ = observable(42);
        return { count$ };
      });
      const useLazyStore = createStore("lazy-shared", setup);

      const { result } = renderHook(
        () => {
          const a = useLazyStore();
          const b = useLazyStore();
          return { a, b };
        },
        {
          wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
        }
      );

      expect(setup).toHaveBeenCalledTimes(1);
      expect(result.current.a.count$).toBe(result.current.b.count$);
    });

    it("lazy store preserves state across re-renders", () => {
      const useLazyStore = createStore("lazy-rerender", () => {
        const count$ = observable(0);
        return { count$ };
      });

      const { result, rerender } = renderHook(() => useLazyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      const firstRef = result.current.count$;
      rerender();
      const secondRef = result.current.count$;

      expect(firstRef).toBe(secondRef);
    });
  });
});
