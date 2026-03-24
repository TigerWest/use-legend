/**
 * useTextSelection — Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Catches issues that JSDOM tests miss — e.g. real Selection API behavior,
 * getBoundingClientRect() returning real values, and batch atomicity.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useTextSelection } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let container: HTMLDivElement;
let textNode: Text;

beforeEach(() => {
  container = document.createElement("div");
  container.textContent = "Hello Browser World";
  document.body.appendChild(container);
  textNode = container.firstChild as Text;
});

afterEach(() => {
  window.getSelection()?.removeAllRanges();
  if (container.parentNode) document.body.removeChild(container);
});

function selectText(node: Text, start = 0, end?: number) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end ?? node.length);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

function clearSelection() {
  window.getSelection()?.removeAllRanges();
  document.dispatchEvent(new Event("selectionchange"));
}

// ---------------------------------------------------------------------------
// useTextSelection — real browser
// ---------------------------------------------------------------------------

describe("useTextSelection() — real browser", () => {
  // -------------------------------------------------------------------------
  // Environment check
  // -------------------------------------------------------------------------

  it("runs in an actual browser environment (not jsdom)", () => {
    expect(typeof window.getSelection).toBe("function");
    expect(window.getSelection()).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Real selection tracking
  // -------------------------------------------------------------------------

  describe("real selection tracking", () => {
    it("updates text$ when text is selected", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));

      expect(result.current.text$.get()).toBe("Hello Browser World");
    });

    it("updates text$ with partial selection", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode, 0, 5));

      expect(result.current.text$.get()).toBe("Hello");
    });

    it("updates ranges$ with the selected range", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));

      expect(result.current.ranges$.get()).toHaveLength(1);
    });

    it("updates rects$ with real DOMRect values", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));

      const rects = result.current.rects$.get();
      expect(rects).toHaveLength(1);
      // Real browser returns non-zero dimensions for visible text
      expect(rects[0].width).toBeGreaterThan(0);
      expect(rects[0].height).toBeGreaterThan(0);
    });

    it("updates selection$ with a non-null Selection object", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));

      expect(result.current.selection$.get()).not.toBeNull();
    });

    it("resets all observables when selection is cleared", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));
      expect(result.current.text$.get()).toBe("Hello Browser World");

      act(() => clearSelection());

      expect(result.current.text$.get()).toBe("");
      expect(result.current.ranges$.get()).toHaveLength(0);
      expect(result.current.rects$.get()).toHaveLength(0);
    });

    it("updates on subsequent selections", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode, 0, 5));
      expect(result.current.text$.get()).toBe("Hello");

      act(() => selectText(textNode, 6, 13));
      expect(result.current.text$.get()).toBe("Browser");
    });
  });

  // -------------------------------------------------------------------------
  // Batch atomicity
  // -------------------------------------------------------------------------

  describe("batch atomicity", () => {
    it("does not expose intermediate state between text$ and rects$", () => {
      const { result } = renderHook(() => useTextSelection());
      let sawIntermediateState = false;

      // Subscribe to text$ and check rects$ synchronously in the same tick
      result.current.text$.onChange(({ value }) => {
        if (value !== "" && result.current.rects$.peek().length === 0) {
          sawIntermediateState = true;
        }
      });

      act(() => selectText(textNode));

      expect(sawIntermediateState).toBe(false);
      expect(result.current.text$.get()).toBe("Hello Browser World");
      expect(result.current.rects$.get()).toHaveLength(1);
    });

    it("does not expose intermediate state on clear", () => {
      const { result } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));

      let sawIntermediateState = false;
      result.current.text$.onChange(({ value }) => {
        if (value === "" && result.current.ranges$.peek().length !== 0) {
          sawIntermediateState = true;
        }
      });

      act(() => clearSelection());

      expect(sawIntermediateState).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe("cleanup", () => {
    it("stops tracking after unmount", () => {
      const { result, unmount } = renderHook(() => useTextSelection());

      act(() => selectText(textNode));
      expect(result.current.text$.get()).toBe("Hello Browser World");

      unmount();

      // After unmount, further selectionchange events should not throw
      expect(() => {
        act(() => clearSelection());
      }).not.toThrow();
    });
  });
});
