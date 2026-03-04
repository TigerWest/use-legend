// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useManualReset } from ".";

describe("useManualReset()", () => {
  describe("initial value", () => {
    it("initializes with defaultValue", () => {
      const { result } = renderHook(() => useManualReset("hello"));

      expect(result.current.value$.get()).toBe("hello");
    });

    it("initializes with Observable defaultValue", () => {
      const default$ = observable("hello");
      const { result } = renderHook(() => useManualReset(default$));

      expect(result.current.value$.get()).toBe("hello");
    });

    it("returns { value$, reset } with correct types", () => {
      const { result } = renderHook(() => useManualReset(0));

      expect(typeof result.current.value$.get).toBe("function");
      expect(typeof result.current.value$.set).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("reset behavior", () => {
    it("reset() restores to default value", () => {
      const { result } = renderHook(() => useManualReset("default"));

      act(() => {
        result.current.value$.set("changed");
      });

      expect(result.current.value$.get()).toBe("changed");

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe("default");
    });

    it("reset() works after multiple value changes", () => {
      const { result } = renderHook(() => useManualReset(0));

      act(() => {
        result.current.value$.set(1);
      });
      act(() => {
        result.current.value$.set(2);
      });
      act(() => {
        result.current.value$.set(3);
      });

      expect(result.current.value$.get()).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe(0);
    });

    it("reset() reads current Observable default (not stale snapshot)", () => {
      const default$ = observable("initial");
      const { result } = renderHook(() => useManualReset(default$));

      act(() => {
        result.current.value$.set("changed");
      });

      // Update the Observable default
      act(() => {
        default$.set("updated-default");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe("updated-default");
    });

    it("reset() can be called multiple times", () => {
      const { result } = renderHook(() => useManualReset("default"));

      act(() => {
        result.current.value$.set("a");
      });
      act(() => {
        result.current.reset();
      });
      expect(result.current.value$.get()).toBe("default");

      act(() => {
        result.current.value$.set("b");
      });
      act(() => {
        result.current.reset();
      });
      expect(result.current.value$.get()).toBe("default");
    });
  });

  describe("value$ behavior", () => {
    it("value$ is writable via .set()", () => {
      const { result } = renderHook(() => useManualReset(""));

      act(() => {
        result.current.value$.set("hello");
      });

      expect(result.current.value$.get()).toBe("hello");
    });

    it("value$ supports functional updater", () => {
      const { result } = renderHook(() => useManualReset(0));

      act(() => {
        result.current.value$.set((v) => v + 1);
      });

      expect(result.current.value$.get()).toBe(1);

      act(() => {
        result.current.value$.set((v) => v + 10);
      });

      expect(result.current.value$.get()).toBe(11);
    });

    it("value$ supports boolean toggle pattern", () => {
      const { result } = renderHook(() => useManualReset(false));

      act(() => {
        result.current.value$.set(true);
      });

      expect(result.current.value$.get()).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe(false);
    });
  });

  describe("unmount", () => {
    it("no errors after unmount", () => {
      const { result, unmount } = renderHook(() => useManualReset(""));

      act(() => {
        result.current.value$.set("hello");
      });

      unmount();

      // Should not throw when accessing after unmount
      expect(() => {
        result.current.reset();
      }).not.toThrow();
    });
  });
});
