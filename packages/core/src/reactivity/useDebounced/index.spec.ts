// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounced } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounced()", () => {
  describe("initial value", () => {
    it("initializes with current source value", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300));

      expect(result.current.get()).toBe("hello");
    });

    it("returns a ReadonlyObservable (.get() works immediately)", () => {
      const source$ = observable(42);
      const { result } = renderHook(() => useDebounced(source$, 300));

      expect(typeof result.current.get).toBe("function");
      expect(result.current.get()).toBe(42);
    });
  });

  describe("debounced updates", () => {
    it("updates debounced value after ms delay when source changes", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300));

      act(() => {
        source$.set("updated");
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("updated");
    });

    it("does not update debounced value before ms elapses", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300));

      act(() => {
        source$.set("updated");
      });

      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.get()).toBe("updated");
    });

    it("only applies latest value when source changes multiple times within delay", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300));

      act(() => {
        source$.set("a");
      });
      act(() => {
        source$.set("b");
      });
      act(() => {
        source$.set("c");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("c");
    });

    it("uses default 200ms when ms not provided", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$));

      act(() => {
        source$.set("updated");
      });

      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.get()).toBe("updated");
    });
  });

  describe("options", () => {
    it("maxWait — forces update after maxWait ms even with continuous source changes", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300, { maxWait: 500 }));

      // keep resetting the debounce timer every 100ms
      act(() => {
        source$.set("a");
        vi.advanceTimersByTime(100);
      });
      act(() => {
        source$.set("b");
        vi.advanceTimersByTime(100);
      });
      act(() => {
        source$.set("c");
        vi.advanceTimersByTime(100);
      });

      // 300ms elapsed total, debounce kept resetting — no update yet
      expect(result.current.get()).toBe("hello");

      // advance to 500ms total — maxWait forces execution
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.get()).toBe("c");
    });
  });

  describe("reactive source (Observable)", () => {
    it("Observable<T> source — tracks changes reactively", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useDebounced(source$, 300));

      act(() => {
        source$.set("world");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("world");
    });

    it("plain T source — returns stable debounced value", () => {
      const { result } = renderHook(() => useDebounced("hello", 300));

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // plain value never changes reactively
      expect(result.current.get()).toBe("hello");
    });
  });

  describe("reactive ms (MaybeObservable)", () => {
    it("Observable<number> ms — delay changes apply to subsequent debounces", () => {
      const source$ = observable("hello");
      const ms$ = observable(300);
      const { result } = renderHook(() => useDebounced(source$, ms$));

      // first call with ms=300
      act(() => {
        source$.set("first");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("first");

      // update ms to 500
      act(() => {
        ms$.set(500);
      });

      act(() => {
        source$.set("second");
      });

      // 300ms not enough for new 500ms delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("first");

      // advance remaining 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.get()).toBe("second");
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw errors after unmount when pending debounce timer fires", () => {
      const source$ = observable("hello");
      const { result, unmount } = renderHook(() => useDebounced(source$, 300));

      act(() => {
        source$.set("updated");
      });

      expect(result.current.get()).toBe("hello");

      unmount();

      // advancing time after unmount should not throw
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });
});
