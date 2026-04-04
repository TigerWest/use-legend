/**
 * useStyleTag - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Verifies that style tags are actually injected into the real DOM
 * and that CSS rules are correctly applied to elements.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { useStyleTag } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let styleIds: string[] = [];

function nextId(): string {
  const id = `usels-browser-test-${styleIds.length}`;
  styleIds.push(id);
  return id;
}

afterEach(() => {
  styleIds.forEach((id) => document.getElementById(id)?.remove());
  styleIds = [];
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useStyleTag() — real browser", () => {
  it("runs in an actual browser environment (not jsdom)", () => {
    expect(typeof window).toBe("object");
    expect(typeof document.createElement).toBe("function");
    expect(typeof document.head.appendChild).toBe("function");
  });

  it("injects a real <style> element into document.head", () => {
    const id = nextId();
    renderHook(() => useStyleTag("body {}", { id }));

    const el = document.getElementById(id);
    expect(el).toBeInstanceOf(HTMLStyleElement);
    expect(document.head.contains(el)).toBe(true);
  });

  it("injected CSS actually applies styles to elements", async () => {
    const id = nextId();
    const targetId = `${id}-target`;

    const div = document.createElement("div");
    div.id = targetId;
    document.body.appendChild(div);

    renderHook(() => useStyleTag(`#${targetId} { color: rgb(255, 0, 0); }`, { id }));

    await waitFor(() => {
      const computed = window.getComputedStyle(div).color;
      expect(computed).toBe("rgb(255, 0, 0)");
    });

    div.remove();
  });

  it("isLoaded$ is true after injection", async () => {
    const id = nextId();
    const { result } = renderHook(() => useStyleTag("body {}", { id }));

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true));
  });

  it("updating css$ changes the real DOM textContent", async () => {
    const id = nextId();
    const { result } = renderHook(() => useStyleTag("body { margin: 0; }", { id }));

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true));

    act(() => {
      result.current.css$.set("body { margin: 8px; }");
    });

    await waitFor(() => {
      const el = document.getElementById(id);
      expect(el?.textContent).toBe("body { margin: 8px; }");
    });
  });

  it("unload() removes the style tag from the real DOM", async () => {
    const id = nextId();
    const { result } = renderHook(() => useStyleTag("body {}", { manual: true, id }));

    act(() => result.current.load());

    await waitFor(() => expect(document.getElementById(id)).not.toBeNull());

    act(() => result.current.unload());

    await waitFor(() => expect(document.getElementById(id)).toBeNull());
    expect(result.current.isLoaded$.get()).toBe(false);
  });

  it("auto-unloads on unmount", async () => {
    const id = nextId();
    const { result, unmount } = renderHook(() => useStyleTag("body {}", { id }));

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true));

    await act(async () => {
      unmount();
    });

    expect(document.getElementById(id)).toBeNull();
  });

  it("manual=true prevents auto-unload on unmount", async () => {
    const id = nextId();
    const { result, unmount } = renderHook(() => useStyleTag("body {}", { id, manual: true }));

    act(() => result.current.load());
    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true));

    await act(async () => {
      unmount();
    });

    expect(document.getElementById(id)).not.toBeNull();
  });

  it("reuses existing style element if id already exists in DOM", async () => {
    const id = nextId();

    const existing = document.createElement("style");
    existing.id = id;
    existing.textContent = "a { color: blue; }";
    document.head.appendChild(existing);

    const { result } = renderHook(() => useStyleTag("body {}", { id, manual: true }));

    act(() => result.current.load());

    await waitFor(() => expect(result.current.isLoaded$.get()).toBe(true));

    const els = document.head.querySelectorAll(`style#${id}`);
    expect(els.length).toBe(1);
  });
});
