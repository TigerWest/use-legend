// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useScriptTag } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll("script[src]").forEach((el) => el.remove());
});

describe("useScriptTag() — edge cases", () => {
  it("does not throw when unload() is called before load()", () => {
    const { result } = renderHook(() =>
      useScriptTag("https://example.com/edge.js", undefined, { manual: true })
    );

    expect(() => {
      act(() => {
        result.current.unload();
      });
    }).not.toThrow();
  });

  it("does not throw when unload() is called after unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useScriptTag("https://example.com/post-unmount.js", undefined, { manual: true })
    );

    await act(async () => {
      await result.current.load(false);
    });

    act(() => unmount());

    expect(() => {
      act(() => {
        result.current.unload();
      });
    }).not.toThrow();
  });

  it("resolves with false when document is null (SSR guard)", async () => {
    const { result } = renderHook(() =>
      useScriptTag("https://example.com/ssr.js", undefined, {
        manual: true,
        document: null as unknown as Document,
      })
    );

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.load(false);
    });

    expect(resolved).toBe(false);
    expect(result.current.scriptTag$.get()).toBeNull();
  });

  it("does not create duplicate script when same src is already in the DOM (not yet loaded)", async () => {
    // Pre-insert a script without data-loaded (still loading)
    const existing = document.createElement("script");
    existing.src = "https://example.com/existing.js";
    document.head.appendChild(existing);

    const createSpy = vi.spyOn(document, "createElement");

    const { result } = renderHook(() =>
      useScriptTag("https://example.com/existing.js", undefined, { manual: true })
    );

    await act(async () => {
      result.current.load(false);
    });

    expect(createSpy).not.toHaveBeenCalledWith("script");

    const els = document.querySelectorAll('script[src="https://example.com/existing.js"]');
    expect(els.length).toBe(1);
  });

  it("rejects promise on script error event", async () => {
    const { result } = renderHook(() =>
      useScriptTag("https://example.com/error.js", undefined, { manual: true })
    );

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.load(true);
    });

    const el = document.querySelector<HTMLScriptElement>(
      'script[src="https://example.com/error.js"]'
    );

    let rejected = false;
    promise!.catch(() => {
      rejected = true;
    });

    await act(async () => {
      el?.dispatchEvent(new Event("error"));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(rejected).toBe(true);
  });

  it("resolves immediately with element when waitForScriptLoad=false", async () => {
    const { result } = renderHook(() =>
      useScriptTag("https://example.com/nowait.js", undefined, { manual: true })
    );

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.load(false);
    });

    expect(resolved).toBeInstanceOf(HTMLScriptElement);
    expect((resolved as HTMLScriptElement).src).toContain("nowait.js");
  });

  it("marks script with data-loaded attribute after load event", async () => {
    const { result } = renderHook(() =>
      useScriptTag("https://example.com/dloaded.js", undefined, { manual: true })
    );

    await act(async () => {
      result.current.load(false);
    });

    const el = document.querySelector<HTMLScriptElement>(
      'script[src="https://example.com/dloaded.js"]'
    );

    await act(async () => {
      el?.dispatchEvent(new Event("load"));
    });

    expect(el?.getAttribute("data-loaded")).toBe("true");
  });
});
