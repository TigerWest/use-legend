// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useMagicKeys } from ".";

describe("useMagicKeys()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns a proxy with current$", () => {
      const { result } = renderHook(() => useMagicKeys());
      expect(result.current.current$).toBeDefined();
      expect(result.current.current$.peek()).toBeInstanceOf(Set);
    });

    it("accessing a key returns an observable", () => {
      const { result } = renderHook(() => useMagicKeys());
      const a = result.current["a"];
      expect(a).toBeDefined();
      expect(typeof a.peek).toBe("function");
      expect(a.peek()).toBe(false);
    });
  });

  describe("single key tracking", () => {
    it("tracks keydown and keyup for a single key", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });
      expect(result.current["a"].peek()).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
      });
      expect(result.current["a"].peek()).toBe(false);
    });

    it("tracks multiple keys simultaneously", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
      });

      expect(result.current["a"].peek()).toBe(true);
      expect(result.current["b"].peek()).toBe(true);
    });

    it("updates current$ set on keydown", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });
      expect(result.current.current$.peek().has("a")).toBe(true);
    });

    it("updates current$ set on keyup", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
      });
      expect(result.current.current$.peek().has("a")).toBe(false);
    });
  });

  describe("alias map", () => {
    it("resolves default alias ctrl → control on keydown", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
      });

      // both "ctrl" and "control" resolve to the same "control" observable
      expect(result.current["ctrl"].peek()).toBe(true);
      expect(result.current["control"].peek()).toBe(true);
    });

    it("resolves default alias esc → escape", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(result.current["esc"].peek()).toBe(true);
      expect(result.current["escape"].peek()).toBe(true);
    });

    it("supports custom alias map", () => {
      const { result } = renderHook(() => useMagicKeys({ aliasMap: { mykey: "a" } }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(result.current["mykey"].peek()).toBe(true);
    });
  });

  describe("combo keys", () => {
    it("tracks Ctrl+A combo — false when only ctrl pressed", () => {
      const { result } = renderHook(() => useMagicKeys());

      // Access the combo to register it
      const combo = result.current["ctrl+a"];
      expect(combo.peek()).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
      });

      expect(combo.peek()).toBe(false);
    });

    it("tracks Ctrl+A combo — true when both pressed", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["ctrl+a"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(combo.peek()).toBe(true);
    });

    it("tracks Ctrl+A combo — false after releasing one key", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["ctrl+a"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
      });

      expect(combo.peek()).toBe(false);
    });

    it("tracks Shift+Enter combo", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["shift+enter"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(combo.peek()).toBe(true);
    });
  });

  describe("onEventFired", () => {
    it("calls onEventFired callback on keydown", () => {
      const onEventFired = vi.fn();
      renderHook(() => useMagicKeys({ onEventFired }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(onEventFired).toHaveBeenCalledOnce();
    });

    it("calls onEventFired callback on keyup", () => {
      const onEventFired = vi.fn();
      renderHook(() => useMagicKeys({ onEventFired }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
      });

      expect(onEventFired).toHaveBeenCalledTimes(2);
    });

    it("skips tracking when onEventFired returns false", () => {
      const { result } = renderHook(() => useMagicKeys({ onEventFired: () => false }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(result.current["a"].peek()).toBe(false);
    });
  });

  describe("blur reset", () => {
    it("resets all keys on window blur", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
      });

      expect(result.current["a"].peek()).toBe(true);
      expect(result.current["b"].peek()).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });

      expect(result.current["a"].peek()).toBe(false);
      expect(result.current["b"].peek()).toBe(false);
      expect(result.current.current$.peek().size).toBe(0);
    });
  });

  describe("macOS meta key handling", () => {
    it("clears all keys when Meta is released", () => {
      const { result } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Meta" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(result.current["a"].peek()).toBe(true);
      expect(result.current.current$.peek().size).toBe(2);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Meta" }));
      });

      expect(result.current["a"].peek()).toBe(false);
      expect(result.current["meta"].peek()).toBe(false);
      expect(result.current.current$.peek().size).toBe(0);
    });
  });

  describe("$ suffix and _ combo destructuring", () => {
    it("$ suffix — tracks single key via shift$", () => {
      const { result } = renderHook(() => useMagicKeys());

      const obs = result.current["shift$"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
      });

      expect(obs.peek()).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
      });

      expect(obs.peek()).toBe(false);
    });

    it("$ suffix — resolves alias via space$", () => {
      const { result } = renderHook(() => useMagicKeys());

      const obs = result.current["space$"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      });

      expect(obs.peek()).toBe(true);
    });

    it("_ combo — Ctrl_A tracks ctrl+a combo", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["Ctrl_A"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(combo.peek()).toBe(true);
    });

    it("_ + $ combo — Ctrl_A$ tracks ctrl+a combo", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["Ctrl_A$"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(combo.peek()).toBe(true);
    });

    it("existing + combo still works", () => {
      const { result } = renderHook(() => useMagicKeys());

      const combo = result.current["ctrl+a"];

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(combo.peek()).toBe(true);
    });

    it("current$ is not affected by $ stripping", () => {
      const { result } = renderHook(() => useMagicKeys());

      expect(result.current.current$.peek()).toBeInstanceOf(Set);
    });

    it("destructured $ suffix works", () => {
      const { result } = renderHook(() => useMagicKeys());

      const { shift$ } = result.current;

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
      });

      expect(shift$.peek()).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("removes listeners on unmount", async () => {
      const onEventFired = vi.fn();
      const { unmount } = renderHook(() => useMagicKeys({ onEventFired }));

      unmount();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(onEventFired).not.toHaveBeenCalled();
    });
  });
});
