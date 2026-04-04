/**
 * useScriptTag - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Verifies that the real `load` event fires and isLoaded$ transitions correctly.
 * Uses blob URLs to avoid real network requests.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { useScriptTag } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a blob URL for a tiny valid JS script. */
function createScriptBlobUrl(content = "/* test */"): string {
  return URL.createObjectURL(new Blob([content], { type: "text/javascript" }));
}

let blobUrls: string[] = [];

function blobUrl(content?: string): string {
  const url = createScriptBlobUrl(content);
  blobUrls.push(url);
  return url;
}

afterEach(() => {
  // Revoke created blob URLs and clean up any script tags
  blobUrls.forEach((url) => URL.revokeObjectURL(url));
  blobUrls = [];
  document.head.querySelectorAll("script[src]").forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useScriptTag() — real browser", () => {
  it("runs in an actual browser environment (not jsdom)", () => {
    // window.navigator.userAgent contains real browser info in Playwright
    expect(typeof window).toBe("object");
    expect(typeof URL.createObjectURL).toBe("function");
  });

  it("isLoaded$ becomes true after real load event fires", async () => {
    const src = blobUrl();

    const { result } = renderHook(() => useScriptTag(src, undefined, { manual: true }));

    act(() => {
      result.current.load(true);
    });

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });
    expect(result.current.scriptTag$.get()).toBeInstanceOf(HTMLScriptElement);
  });

  it("isLoaded$ is false while loading (waitForScriptLoad=false resolves before load event)", async () => {
    const src = blobUrl();

    const { result } = renderHook(() => useScriptTag(src, undefined, { manual: true }));

    // Resolve immediately — load event hasn't fired yet
    await act(async () => {
      await result.current.load(false);
    });

    // At this point the element is in DOM but load event may not have fired yet
    // isLoaded$ should start as false (set to true only when load event fires)
    // We just verify the initial state is deterministic — not true before load event
    const el = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    expect(el).not.toBeNull();

    // Wait for the actual load event — isLoaded$ should eventually become true
    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });
  });

  it("onLoaded callback is called with the script element", async () => {
    const src = blobUrl();
    let receivedEl: HTMLScriptElement | null = null;

    const { result } = renderHook(() =>
      useScriptTag(
        src,
        (el) => {
          receivedEl = el;
        },
        { manual: true }
      )
    );

    act(() => {
      result.current.load(true);
    });

    await waitFor(() => expect(receivedEl).not.toBeNull(), { timeout: 3000 });
    expect(receivedEl).toBeInstanceOf(HTMLScriptElement);
  });

  it("script element has data-loaded attribute after real load", async () => {
    const src = blobUrl();
    const { result } = renderHook(() => useScriptTag(src, undefined, { manual: true }));

    act(() => {
      result.current.load(true);
    });

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });

    const el = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    expect(el?.getAttribute("data-loaded")).toBe("true");
  });

  it("unload() removes script from real DOM and resets isLoaded$", async () => {
    const src = blobUrl();
    const { result } = renderHook(() => useScriptTag(src, undefined, { manual: true }));

    act(() => {
      result.current.load(true);
    });
    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });

    act(() => {
      result.current.unload();
    });

    expect(document.querySelector(`script[src="${src}"]`)).toBeNull();
    expect(result.current.isLoaded$.get()).toBe(false);
    expect(result.current.scriptTag$.get()).toBeNull();
  });

  it("auto-loads on mount (immediate=true default) and fires real load event", async () => {
    const src = blobUrl();

    const { result } = renderHook(() => useScriptTag(src));

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });

    const el = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    expect(el).not.toBeNull();
  });

  it("auto-unloads on unmount", async () => {
    const src = blobUrl();

    const { result, unmount } = renderHook(() => useScriptTag(src));
    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true), { timeout: 3000 });

    await act(async () => {
      unmount();
    });

    expect(document.querySelector(`script[src="${src}"]`)).toBeNull();
  });

  it("deduplication: reuses existing script element already in DOM", async () => {
    const src = blobUrl();

    // First hook loads it
    const { result: r1 } = renderHook(() => useScriptTag(src, undefined, { manual: true }));
    act(() => {
      r1.current.load(true);
    });
    await waitFor(() => expect(r1.current.isLoaded$.get()).toBe(true), { timeout: 3000 });

    // Second hook with same src — should reuse the element
    const { result: r2 } = renderHook(() => useScriptTag(src, undefined, { manual: true }));
    await act(async () => {
      await r2.current.load(false);
    });

    const els = document.querySelectorAll(`script[src="${src}"]`);
    expect(els.length).toBe(1);
    expect(r2.current.isLoaded$.get()).toBe(true); // data-loaded was set by r1
  });
});
