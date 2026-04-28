// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useScope, onBeforeMount, onMount, onUnmount, createObserve } from ".";

describe("useScope()", () => {
  describe("factory execution", () => {
    it("runs factory exactly once", () => {
      const factory = vi.fn(() => ({}));
      const { rerender } = renderHook(() => useScope(factory));
      rerender();
      rerender();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("returns the factory result", () => {
      const { result } = renderHook(() => useScope(() => ({ value: 42, name: "test" })));
      expect(result.current.value).toBe(42);
      expect(result.current.name).toBe("test");
    });

    it("returned result is the same reference across re-renders", () => {
      const { result, rerender } = renderHook(() => useScope(() => ({ obj: {} })));
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe("onBeforeMount", () => {
    it("calls callback before paint (synchronous, before useEffect)", () => {
      const order: string[] = [];

      renderHook(() =>
        useScope(() => {
          onBeforeMount(() => {
            order.push("beforeMount");
          });
          onMount(() => {
            order.push("mount");
          });
          return {};
        })
      );

      // useLayoutEffect fires before useEffect
      expect(order).toEqual(["beforeMount", "mount"]);
    });

    it("calls onBeforeMount callback exactly once", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(() =>
        useScope(() => {
          onBeforeMount(spy);
          return {};
        })
      );
      rerender();
      rerender();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("multiple onBeforeMount callbacks called in registration order", () => {
      const order: number[] = [];
      renderHook(() =>
        useScope(() => {
          onBeforeMount(() => {
            order.push(1);
          });
          onBeforeMount(() => {
            order.push(2);
          });
          onBeforeMount(() => {
            order.push(3);
          });
          return {};
        })
      );
      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe("onMount", () => {
    it("calls callback after mount", () => {
      const spy = vi.fn();
      renderHook(() =>
        useScope(() => {
          onMount(spy);
          return {};
        })
      );
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("calls multiple onMount callbacks in registration order", () => {
      const order: number[] = [];
      renderHook(() =>
        useScope(() => {
          onMount(() => {
            order.push(1);
          });
          onMount(() => {
            order.push(2);
          });
          onMount(() => {
            order.push(3);
          });
          return {};
        })
      );
      expect(order).toEqual([1, 2, 3]);
    });

    it("cleanup return from onMount is called on unmount", () => {
      const cleanup = vi.fn();
      const { unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => cleanup);
          return {};
        })
      );
      expect(cleanup).not.toHaveBeenCalled();
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("multiple onMount cleanups called in reverse registration order on unmount", () => {
      const order: number[] = [];
      const { unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => () => order.push(1));
          onMount(() => () => order.push(2));
          onMount(() => () => order.push(3));
          return {};
        })
      );
      unmount();
      expect(order).toEqual([3, 2, 1]);
    });

    it("onMount without cleanup return does not throw on unmount", () => {
      const { unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => {
            /* no return */
          });
          return {};
        })
      );
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("onUnmount", () => {
    it("calls callback on unmount", () => {
      const spy = vi.fn();
      const { unmount } = renderHook(() =>
        useScope(() => {
          onUnmount(spy);
          return {};
        })
      );
      expect(spy).not.toHaveBeenCalled();
      unmount();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("onUnmount and onMount cleanup both execute on unmount", () => {
      const mountCleanup = vi.fn();
      const unmountCb = vi.fn();
      const { unmount } = renderHook(() =>
        useScope(() => {
          onMount(() => mountCleanup);
          onUnmount(unmountCb);
          return {};
        })
      );
      unmount();
      expect(mountCleanup).toHaveBeenCalledTimes(1);
      expect(unmountCb).toHaveBeenCalledTimes(1);
    });
  });

  describe("observe integration", () => {
    it("observe inside scope is automatically disposed on unmount", () => {
      const count$ = observable(0);
      const spy = vi.fn();

      const { unmount } = renderHook(() =>
        useScope(() => {
          createObserve(() => {
            spy(count$.get());
          });
          return {};
        })
      );

      // observe runs immediately on creation
      expect(spy).toHaveBeenCalledTimes(1);

      unmount();

      // after unmount, count$ change should not trigger spy
      act(() => count$.set(1));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("observe tracks reactive values inside factory", () => {
      const val$ = observable("hello");
      const spy = vi.fn();

      renderHook(() =>
        useScope(() => {
          createObserve(() => spy(val$.get()));
          return {};
        })
      );

      act(() => val$.set("world"));
      expect(spy).toHaveBeenLastCalledWith("world");
    });
  });

  describe("scope disposal on unmount", () => {
    it("scope is disposed on unmount", () => {
      renderHook(() =>
        useScope(() => {
          onMount(() => {});
          return {};
        })
      );
      // Register via observe to verify disposal
      const count$ = observable(0);
      const trackSpy = vi.fn();

      const { unmount: unmount2 } = renderHook(() =>
        useScope(() => {
          createObserve(() => trackSpy(count$.get()));
          return {};
        })
      );

      unmount2();
      act(() => count$.set(99));
      // If scope disposed, trackSpy should not have been called again
      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });
});
