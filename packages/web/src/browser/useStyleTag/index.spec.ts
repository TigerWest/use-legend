// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useStyleTag } from ".";

beforeEach(() => {
  document.head.querySelectorAll("style[id^='usels_style_']").forEach((el) => el.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll("style[id^='usels_style_']").forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// return type / structure
// ---------------------------------------------------------------------------

describe("useStyleTag()", () => {
  describe("return type", () => {
    it("returns id, css$, isLoaded$, load, and unload", () => {
      const { result } = renderHook(() => useStyleTag("body { color: red; }", { manual: true }));
      expect(typeof result.current.id).toBe("string");
      expect(typeof result.current.css$.get).toBe("function");
      expect(typeof result.current.isLoaded$.get).toBe("function");
      expect(typeof result.current.load).toBe("function");
      expect(typeof result.current.unload).toBe("function");
    });

    it("css$ initial value matches the css argument", () => {
      const { result } = renderHook(() => useStyleTag("body { color: red; }", { manual: true }));
      expect(result.current.css$.get()).toBe("body { color: red; }");
    });

    it("isLoaded$ initial value is false", () => {
      const { result } = renderHook(() => useStyleTag("body { color: red; }", { manual: true }));
      expect(result.current.isLoaded$.get()).toBe(false);
    });

    it("uses provided id option", () => {
      const { result } = renderHook(() => useStyleTag("body {}", { manual: true, id: "my-style" }));
      expect(result.current.id).toBe("my-style");
    });
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------

  describe("load()", () => {
    it("appends a style element to document.head", () => {
      const { result } = renderHook(() =>
        useStyleTag("body { color: red; }", { manual: true, id: "test-load" })
      );

      act(() => {
        result.current.load();
      });

      const el = document.getElementById("test-load");
      expect(el).not.toBeNull();
      expect(el?.tagName).toBe("STYLE");
    });

    it("sets textContent to the css value", () => {
      const { result } = renderHook(() =>
        useStyleTag("body { color: red; }", { manual: true, id: "test-content" })
      );

      act(() => {
        result.current.load();
      });

      const el = document.getElementById("test-content");
      expect(el?.textContent).toBe("body { color: red; }");
    });

    it("sets isLoaded$ to true after load", () => {
      const { result } = renderHook(() => useStyleTag("body { color: red; }", { manual: true }));

      act(() => {
        result.current.load();
      });

      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("sets media attribute when option provided", () => {
      const { result } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-media", media: "print" })
      );

      act(() => {
        result.current.load();
      });

      const el = document.getElementById("test-media") as HTMLStyleElement;
      expect(el?.media).toBe("print");
    });

    it("sets nonce attribute when option provided", () => {
      const { result } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-nonce", nonce: "abc123" })
      );

      act(() => {
        result.current.load();
      });

      const el = document.getElementById("test-nonce") as HTMLStyleElement;
      expect(el?.nonce).toBe("abc123");
    });

    it("reuses existing element if id already exists in DOM", () => {
      const existing = document.createElement("style");
      existing.id = "test-reuse";
      existing.textContent = "a { color: blue; }";
      document.head.appendChild(existing);

      const createSpy = vi.spyOn(document, "createElement");

      const { result } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-reuse" })
      );

      act(() => {
        result.current.load();
      });

      expect(createSpy).not.toHaveBeenCalledWith("style");
      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("does nothing when document is not available (SSR)", () => {
      const { result } = renderHook(() =>
        useStyleTag("body {}", {
          manual: true,
          id: "test-ssr",
          document: null as unknown as Document,
        })
      );

      expect(() => {
        act(() => {
          result.current.load();
        });
      }).not.toThrow();

      expect(result.current.isLoaded$.get()).toBe(false);
    });

    it("accepts MaybeObservable<string> css", () => {
      const css$ = observable("h1 { color: blue; }");

      const { result } = renderHook(() =>
        useStyleTag(css$, { manual: true, id: "test-observable-css" })
      );

      act(() => {
        result.current.load();
      });

      const el = document.getElementById("test-observable-css");
      expect(el?.textContent).toBe("h1 { color: blue; }");
    });
  });

  // ---------------------------------------------------------------------------
  // unload
  // ---------------------------------------------------------------------------

  describe("unload()", () => {
    it("removes the style element from document.head", () => {
      const { result } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-unload" })
      );

      act(() => {
        result.current.load();
      });

      act(() => {
        result.current.unload();
      });

      expect(document.getElementById("test-unload")).toBeNull();
    });

    it("sets isLoaded$ to false after unload", () => {
      const { result } = renderHook(() => useStyleTag("body {}", { manual: true }));

      act(() => {
        result.current.load();
      });

      expect(result.current.isLoaded$.get()).toBe(true);

      act(() => {
        result.current.unload();
      });

      expect(result.current.isLoaded$.get()).toBe(false);
    });

    it("allows load() to be called again after unload()", () => {
      const { result } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-reload" })
      );

      act(() => {
        result.current.load();
      });

      act(() => {
        result.current.unload();
      });

      act(() => {
        result.current.load();
      });

      expect(document.getElementById("test-reload")).not.toBeNull();
      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("does not throw when called before load()", () => {
      const { result } = renderHook(() => useStyleTag("body {}", { manual: true }));

      expect(() => {
        act(() => {
          result.current.unload();
        });
      }).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // css$ reactivity
  // ---------------------------------------------------------------------------

  describe("css$ reactivity", () => {
    it("updates style tag textContent when css$ is set", () => {
      const { result } = renderHook(() =>
        useStyleTag("body { color: red; }", { manual: true, id: "test-reactive" })
      );

      act(() => {
        result.current.load();
      });

      act(() => {
        result.current.css$.set("body { color: blue; }");
      });

      const el = document.getElementById("test-reactive");
      expect(el?.textContent).toBe("body { color: blue; }");
    });

    it("updates css$ when Observable css prop changes", () => {
      const css$ = observable("h1 { color: red; }");

      const { result } = renderHook(() => useStyleTag(css$, { manual: true, id: "test-obs-sync" }));

      act(() => {
        result.current.load();
      });

      act(() => {
        css$.set("h1 { color: green; }");
      });

      expect(result.current.css$.get()).toBe("h1 { color: green; }");
      const el = document.getElementById("test-obs-sync");
      expect(el?.textContent).toBe("h1 { color: green; }");
    });
  });

  // ---------------------------------------------------------------------------
  // lifecycle — immediate / manual
  // ---------------------------------------------------------------------------

  describe("lifecycle", () => {
    it("loads style tag on mount when immediate=true (default)", () => {
      renderHook(() => useStyleTag("body {}", { id: "test-auto-load" }));

      const el = document.getElementById("test-auto-load");
      expect(el).not.toBeNull();
    });

    it("does not load style tag on mount when immediate=false", () => {
      renderHook(() => useStyleTag("body {}", { immediate: false, id: "test-no-immediate" }));

      expect(document.getElementById("test-no-immediate")).toBeNull();
    });

    it("unloads style tag on unmount by default", async () => {
      const { unmount } = renderHook(() => useStyleTag("body {}", { id: "test-unmount" }));

      await act(async () => {});

      expect(document.getElementById("test-unmount")).not.toBeNull();

      await act(async () => {
        unmount();
      });

      expect(document.getElementById("test-unmount")).toBeNull();
    });

    it("does not unload style tag on unmount when manual=true", () => {
      const { result, unmount } = renderHook(() =>
        useStyleTag("body {}", { manual: true, id: "test-manual-unmount" })
      );

      act(() => {
        result.current.load();
      });

      act(() => {
        unmount();
      });

      expect(document.getElementById("test-manual-unmount")).not.toBeNull();

      // Cleanup
      document.getElementById("test-manual-unmount")?.remove();
    });
  });
});
