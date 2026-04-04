// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useScriptTag } from ".";

beforeEach(() => {
  // Clean up any script tags added during tests
  document.head.querySelectorAll("script[data-test]").forEach((el) => el.remove());
  document.head.querySelectorAll("script[src]").forEach((el) => el.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll("script[src]").forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// return type / structure
// ---------------------------------------------------------------------------

describe("useScriptTag()", () => {
  describe("return type", () => {
    it("returns scriptTag$, isLoaded$, load, and unload", () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );
      expect(typeof result.current.scriptTag$.get).toBe("function");
      expect(typeof result.current.isLoaded$.get).toBe("function");
      expect(typeof result.current.load).toBe("function");
      expect(typeof result.current.unload).toBe("function");
    });

    it("scriptTag$ initial value is null", () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );
      expect(result.current.scriptTag$.get()).toBeNull();
    });

    it("isLoaded$ initial value is false", () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );
      expect(result.current.isLoaded$.get()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------

  describe("load()", () => {
    it("appends a script element to document.head", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el).not.toBeNull();
    });

    it("sets scriptTag$ to the script element when waitForScriptLoad=false", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      expect(result.current.scriptTag$.get()).toBeInstanceOf(HTMLScriptElement);
    });

    it("sets async attribute by default", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el?.async).toBe(true);
    });

    it("sets type attribute", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, {
          manual: true,
          type: "module",
        })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el?.type).toBe("module");
    });

    it("sets defer attribute when option provided", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, {
          manual: true,
          defer: true,
        })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el?.defer).toBe(true);
    });

    it("sets crossOrigin attribute when option provided", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, {
          manual: true,
          crossOrigin: "anonymous",
        })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el?.crossOrigin).toBe("anonymous");
    });

    it("sets custom attrs on script element", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, {
          manual: true,
          attrs: { "data-test": "true", id: "my-script" },
        })
      );

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );
      expect(el?.getAttribute("data-test")).toBe("true");
      expect(el?.getAttribute("id")).toBe("my-script");
    });

    it("returns same promise on subsequent load() calls (deduplication)", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      let p1: Promise<unknown>;
      let p2: Promise<unknown>;

      await act(async () => {
        p1 = result.current.load(false);
        p2 = result.current.load(false);
      });

      expect(p1!).toBe(p2!);
    });

    it("calls onLoaded callback when script fires load event", async () => {
      const onLoaded = vi.fn();
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", onLoaded, { manual: true })
      );

      await act(async () => {
        result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/script.js"]'
      );

      await act(async () => {
        el?.dispatchEvent(new Event("load"));
      });

      expect(onLoaded).toHaveBeenCalledWith(el);
    });

    it("resolves with false when document is not available (SSR)", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, {
          manual: true,
          document: null as unknown as Document,
        })
      );

      let resolved: unknown;
      await act(async () => {
        resolved = await result.current.load(false);
      });

      expect(resolved).toBe(false);
    });

    it("accepts MaybeObservable<string> src", async () => {
      const src$ = observable("https://example.com/obs-script.js");

      const { result } = renderHook(() => useScriptTag(src$, undefined, { manual: true }));

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/obs-script.js"]'
      );
      expect(el).not.toBeNull();
    });

    it("isLoaded$ is false before load event fires (waitForScriptLoad=false resolves early)", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/isloaded-false.js", undefined, { manual: true })
      );

      // waitForScriptLoad=false: resolves immediately, load event hasn't fired
      await act(async () => {
        await result.current.load(false);
      });

      expect(result.current.isLoaded$.get()).toBe(false);
    });

    it("isLoaded$ becomes true when load event fires", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/isloaded-true.js", undefined, { manual: true })
      );

      await act(async () => {
        result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/isloaded-true.js"]'
      );

      await act(async () => {
        el?.dispatchEvent(new Event("load"));
      });

      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("isLoaded$ is true immediately when pre-loaded element found (data-loaded)", async () => {
      const existing = document.createElement("script");
      existing.src = "https://example.com/preloaded2.js";
      existing.setAttribute("data-loaded", "true");
      document.head.appendChild(existing);

      const { result } = renderHook(() =>
        useScriptTag("https://example.com/preloaded2.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      expect(result.current.isLoaded$.get()).toBe(true);
    });

    it("reuses an already-loaded script element (data-loaded attribute)", async () => {
      // Pre-insert a script that is already "loaded"
      const existing = document.createElement("script");
      existing.src = "https://example.com/preloaded.js";
      existing.setAttribute("data-loaded", "true");
      document.head.appendChild(existing);

      const createSpy = vi.spyOn(document, "createElement");

      const { result } = renderHook(() =>
        useScriptTag("https://example.com/preloaded.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      // Should not create a new script element
      expect(createSpy).not.toHaveBeenCalledWith("script");
      expect(result.current.scriptTag$.get()).toBe(existing);
    });
  });

  // ---------------------------------------------------------------------------
  // unload
  // ---------------------------------------------------------------------------

  describe("unload()", () => {
    it("removes the script element from document.head", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      act(() => {
        result.current.unload();
      });

      const el = document.querySelector('script[src="https://example.com/script.js"]');
      expect(el).toBeNull();
    });

    it("sets scriptTag$ to null after unload", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      act(() => {
        result.current.unload();
      });

      expect(result.current.scriptTag$.get()).toBeNull();
    });

    it("isLoaded$ resets to false after unload()", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/unload-reset.js", undefined, { manual: true })
      );

      await act(async () => {
        result.current.load(false);
      });

      const el = document.querySelector<HTMLScriptElement>(
        'script[src="https://example.com/unload-reset.js"]'
      );
      await act(async () => {
        el?.dispatchEvent(new Event("load"));
      });

      expect(result.current.isLoaded$.get()).toBe(true);

      act(() => {
        result.current.unload();
      });

      expect(result.current.isLoaded$.get()).toBe(false);
    });

    it("allows load() to be called again after unload()", async () => {
      const { result } = renderHook(() =>
        useScriptTag("https://example.com/script.js", undefined, { manual: true })
      );

      await act(async () => {
        await result.current.load(false);
      });

      act(() => {
        result.current.unload();
      });

      await act(async () => {
        await result.current.load(false);
      });

      const el = document.querySelector('script[src="https://example.com/script.js"]');
      expect(el).not.toBeNull();
      expect(result.current.scriptTag$.get()).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // lifecycle — immediate / manual
  // ---------------------------------------------------------------------------

  describe("lifecycle", () => {
    it("loads script on mount when immediate=true (default)", async () => {
      await act(async () => {
        renderHook(() => useScriptTag("https://example.com/auto.js"));
      });

      const el = document.querySelector('script[src="https://example.com/auto.js"]');
      expect(el).not.toBeNull();
    });

    it("does not load script on mount when immediate=false", async () => {
      await act(async () => {
        renderHook(() =>
          useScriptTag("https://example.com/noimmediate.js", undefined, { immediate: false })
        );
      });

      const el = document.querySelector('script[src="https://example.com/noimmediate.js"]');
      expect(el).toBeNull();
    });

    it("unloads script on unmount by default", async () => {
      const { unmount } = renderHook(() =>
        useScriptTag("https://example.com/unmount.js", undefined, { immediate: true })
      );

      // Wait for mount
      await act(async () => {});

      await act(async () => {
        unmount();
      });

      const el = document.querySelector('script[src="https://example.com/unmount.js"]');
      expect(el).toBeNull();
    });

    it("does not unload script on unmount when manual=true", async () => {
      const { unmount } = renderHook(() =>
        useScriptTag("https://example.com/manual.js", undefined, {
          manual: true,
        })
      );

      // Manually load
      await act(async () => {});

      // Insert the script manually for this test
      const el = document.createElement("script");
      el.src = "https://example.com/manual.js";
      document.head.appendChild(el);

      act(() => {
        unmount();
      });

      // Should still be present (manual=true means no auto-unload)
      const found = document.querySelector('script[src="https://example.com/manual.js"]');
      expect(found).not.toBeNull();
    });
  });
});
