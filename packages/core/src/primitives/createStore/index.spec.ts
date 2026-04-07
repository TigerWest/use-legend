// @vitest-environment jsdom
import React from "react";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { observable } from "@legendapp/state";
import { createStore, StoreProvider, useStoreRegistry, __resetStoreDefinitions } from ".";
import { act } from "@testing-library/react";
import { onMount, onUnmount, onBeforeMount } from "../useScope/effectScope";
import { useScope } from "../useScope";

beforeEach(() => {
  __resetStoreDefinitions();
});

describe("createStore()", () => {
  describe("return type / structure", () => {
    it("returns a tuple of [useStore, getStore]", () => {
      const tuple = createStore("test", () => ({ value: 1 }));
      expect(Array.isArray(tuple)).toBe(true);
      expect(tuple).toHaveLength(2);
    });

    it("both tuple elements are functions", () => {
      const [useStore, getStore] = createStore("ds-fns", () => ({ v: 1 }));
      expect(typeof useStore).toBe("function");
      expect(typeof getStore).toBe("function");
    });
  });

  describe("basic usage", () => {
    it("useStore returns the setup return value", () => {
      const [useCountStore] = createStore("count", () => {
        return { count: 42 };
      });

      const { result } = renderHook(() => useCountStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.count).toBe(42);
    });

    it("useStore returns the same reference across multiple calls", () => {
      const [useMyStore] = createStore("ref-test", () => {
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
      const [useStoreA] = createStore("a", () => ({ value: "A" }));
      const [useStoreB] = createStore("b", () => ({ value: "B" }));

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
      const [useMyStore] = createStore("obs-test", () => {
        const count$ = observable(0);
        return { count$ };
      });

      const { result } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.count$.get()).toBe(0);
    });

    it("plain ref object works inside setup", () => {
      const [useMyStore] = createStore("ref-hook-test", () => {
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
      const [useAuthStore] = createStore("auth", () => {
        return { user: "Alice" };
      });

      const [useProfileStore] = createStore("profile", () => {
        const auth = useAuthStore();
        return { greeting: `Hello, ${auth.user}` };
      });

      const { result } = renderHook(() => useProfileStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(result.current.greeting).toBe("Hello, Alice");
    });

    it("three-level dependency chain works", () => {
      const [useBase] = createStore("base", () => ({ n: 1 }));
      const [useMid] = createStore("mid", () => {
        const base = useBase();
        return { n: base.n + 1 };
      });
      const [useTop] = createStore("top", () => {
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
      const [useMyStore] = createStore("no-provider", () => ({ v: 1 }));
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
        createStore("dup", () => ({}) as Record<string, unknown>);
        expect(() => {
          createStore("dup", () => ({}) as Record<string, unknown>);
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
      const [useMyStore] = createStore("unmount-test", () => ({ v: 1 }));

      const { unmount } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("shared state across consumers", () => {
    it("multiple hooks in the same Provider share the same store instance", () => {
      const [useMyStore] = createStore("shared", () => {
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
      const [useLazyStore] = createStore("lazy-init", setup);

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
      const [useLazyStore] = createStore("lazy-shared", setup);

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
      const [useLazyStore] = createStore("lazy-rerender", () => {
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

  describe("useStore (tuple[0])", () => {
    it("works as a React hook inside StoreProvider", () => {
      const [useMyStore] = createStore("ds-hook", () => ({ value: 42 }));
      const { result } = renderHook(() => useMyStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });
      expect(result.current.value).toBe(42);
    });

    it("throws when used outside StoreProvider", () => {
      const [useMyStore] = createStore("ds-no-provider", () => ({ v: 1 }));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useMyStore());
      }).toThrow(/StoreProvider/);
      spy.mockRestore();
    });
  });

  describe("getStore accessor (tuple[1])", () => {
    it("works inside another store's setup", () => {
      const [, getBaseStore] = createStore("ds-base", () => ({ n: 10 }));
      const [useDerived] = createStore("ds-derived", () => {
        const base = getBaseStore();
        return { n: base.n * 2 };
      });

      const { result } = renderHook(() => useDerived(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });
      expect(result.current.n).toBe(20);
    });

    it("throws when called outside a store setup", () => {
      const [, getBaseStore] = createStore("ds-accessor-outside", () => ({ n: 1 }));
      expect(() => getBaseStore()).toThrow(/setup/);
    });
  });

  describe("inter-store dependency via getStore", () => {
    it("three-level chain: A → B.getStore → C.getStore", () => {
      const [, getA] = createStore("ds-chain-a", () => ({ n: 1 }));
      const [, getB] = createStore("ds-chain-b", () => {
        const a = getA();
        return { n: a.n + 1 };
      });
      const [useC] = createStore("ds-chain-c", () => {
        const b = getB();
        return { n: b.n + 1 };
      });

      const { result } = renderHook(() => useC(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });
      expect(result.current.n).toBe(3);
    });

    it("useStore (tuple[0]) also works inside another store's setup (activeValue path)", () => {
      const [useAuth] = createStore("ds-compat-auth", () => ({ user: "Bob" }));
      const [useProfile] = createStore("ds-compat-profile", () => {
        const auth = useAuth(); // useStore inside setup — activeValue path
        return { greeting: `Hi, ${auth.user}` };
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });
      expect(result.current.greeting).toBe("Hi, Bob");
    });
  });
});

describe("effectScope integration", () => {
  describe("onMount / onUnmount", () => {
    it("onMount callback runs when StoreProvider mounts", async () => {
      const mounted = vi.fn();
      const [useStore] = createStore("es-mount", () => {
        onMount(mounted);
        return {};
      });

      const { unmount } = renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(mounted).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("onMount return cleanup runs on StoreProvider unmount", async () => {
      const cleanup = vi.fn();
      const [useStore] = createStore("es-mount-cleanup", () => {
        onMount(() => cleanup);
        return {};
      });

      const { unmount } = renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(cleanup).not.toHaveBeenCalled();
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("onUnmount callback runs on StoreProvider unmount", async () => {
      const unmountCb = vi.fn();
      const [useStore] = createStore("es-unmount", () => {
        onUnmount(unmountCb);
        return {};
      });

      const { unmount } = renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(unmountCb).not.toHaveBeenCalled();
      unmount();
      expect(unmountCb).toHaveBeenCalledTimes(1);
    });

    it("multiple onMount cleanup callbacks run in reverse order on unmount", async () => {
      const order: number[] = [];
      const [useStore] = createStore("es-reverse-order", () => {
        onMount(() => () => order.push(1));
        onMount(() => () => order.push(2));
        onMount(() => () => order.push(3));
        return {};
      });

      const { unmount } = renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      unmount();
      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe("inter-store scope isolation", () => {
    it("dependent store scopes are independent (no parent-child)", () => {
      const [, getA] = createStore("es-iso-a", () => ({ v: "a" }));
      const [useB] = createStore("es-iso-b", () => {
        getA();
        return { v: "b" };
      });

      const { result } = renderHook(() => useB(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      // Both stores exist and are independent
      expect(result.current.v).toBe("b");
    });
  });

  describe("dev warnings", () => {
    it("warns when onBeforeMount is called in store setup (dev only)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const [useStore] = createStore("es-warn-before-mount", () => {
        onBeforeMount(() => {});
        return {};
      });

      renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("onBeforeMount"));
      warn.mockRestore();
    });

    it("does NOT warn for onMount/onUnmount in store setup", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const [useStore] = createStore("es-no-warn-mount", () => {
        onMount(() => {});
        onUnmount(() => {});
        return {};
      });

      renderHook(() => useStore(), {
        wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe("error resilience", () => {
    it("scope dispose errors do not prevent other scopes from disposing", async () => {
      const secondDisposed = vi.fn();
      const [useA] = createStore("es-err-a", () => {
        onUnmount(() => {
          throw new Error("dispose error");
        });
        return {};
      });
      const [useB] = createStore("es-err-b", () => {
        onUnmount(secondDisposed);
        return {};
      });

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { unmount } = renderHook(
        () => {
          useA();
          useB();
        },
        {
          wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
        }
      );

      unmount();
      expect(secondDisposed).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("lazy init limitation", () => {
    it("onMount is NOT called for stores first accessed after StoreProvider mount", async () => {
      const mounted = vi.fn();
      const [useLate] = createStore("es-late-init", () => {
        onMount(mounted);
        return {};
      });

      // Render without accessing useLate — StoreProvider mounts first
      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(StoreProvider, { children });

      const { rerender } = renderHook(
        ({ access }: { access: boolean }) => {
          if (access) useLate();
        },
        {
          wrapper: TestWrapper,
          initialProps: { access: false },
        }
      );

      // StoreProvider already mounted, now access store for the first time
      act(() => {
        rerender({ access: true });
      });

      // onMount was NOT called because StoreProvider already ran its useEffect
      expect(mounted).not.toHaveBeenCalled();
    });

    it("onUnmount is NOT called for stores first accessed after StoreProvider mount", async () => {
      const unmountCb = vi.fn();
      const [useLate] = createStore("es-late-unmount", () => {
        onUnmount(unmountCb);
        return {};
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(StoreProvider, { children });

      const { rerender, unmount } = renderHook(
        ({ access }: { access: boolean }) => {
          if (access) useLate();
        },
        {
          wrapper: TestWrapper,
          initialProps: { access: false },
        }
      );

      // Access store after mount
      act(() => {
        rerender({ access: true });
      });

      // Unmount — onUnmount was NOT called because the store was never part of the initial mount lifecycle
      unmount();
      expect(unmountCb).not.toHaveBeenCalled();
    });
  });
});

describe("getStore() inside useScope", () => {
  it("getStore() resolves the store inside a useScope factory within StoreProvider", () => {
    const [, getCountStore] = createStore("us-gs-basic", () => ({ n: 42 }));

    const { result } = renderHook(
      () =>
        useScope(() => {
          const store = getCountStore();
          return { n: store.n };
        }),
      { wrapper: ({ children }) => React.createElement(StoreProvider, { children }) }
    );

    expect(result.current.n).toBe(42);
  });

  it("getStore() throws inside useScope without StoreProvider", () => {
    const [, getMyStore] = createStore("us-gs-no-provider", () => ({ v: 1 }));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() =>
        useScope(() => {
          getMyStore(); // no StoreProvider → activeValue is null → throws
          return {};
        })
      );
    }).toThrow(/StoreProvider/);

    spy.mockRestore();
  });

  it("getStore() inside useScope shares the same registry as useStore()", () => {
    const [useShared, getShared] = createStore("us-gs-shared", () => {
      const count$ = observable(0);
      return { count$ };
    });

    const { result } = renderHook(
      () => {
        const fromHook = useShared();
        const fromScope = useScope(() => {
          const s = getShared();
          return { count$: s.count$ };
        });
        return { fromHook, fromScope };
      },
      { wrapper: ({ children }) => React.createElement(StoreProvider, { children }) }
    );

    // Same observable reference — same registry instance
    expect(result.current.fromHook.count$).toBe(result.current.fromScope.count$);
  });
});

describe("useStoreRegistry()", () => {
  it("returns null when outside StoreProvider", () => {
    const { result } = renderHook(() => useStoreRegistry());
    expect(result.current).toBeNull();
  });

  it("returns the registry when inside StoreProvider", () => {
    const { result } = renderHook(() => useStoreRegistry(), {
      wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
    });
    expect(result.current).not.toBeNull();
    expect(result.current?.registry).toBeInstanceOf(Map);
  });

  it("returns a stable reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useStoreRegistry(), {
      wrapper: ({ children }) => React.createElement(StoreProvider, { children }),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
