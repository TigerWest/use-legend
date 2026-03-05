/**
 * useDraggable - Edge Cases Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Edge-case tests separated from index.browser.spec.ts per the test plan.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDraggable } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "100px",
    height: "100px",
  });
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
  document.body.style.margin = "";
  document.body.style.padding = "";
  vi.restoreAllMocks();
});

function firePointerDown(
  target: EventTarget,
  clientX: number,
  clientY: number,
  pointerType = "mouse"
) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX,
        clientY,
        pointerType,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function firePointerMove(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

// ---------------------------------------------------------------------------
// useDraggable — edge cases (real browser)
// ---------------------------------------------------------------------------

describe("useDraggable() — edge cases (real browser)", () => {
  it("onStart returning false cancels drag", async () => {
    const { result } = renderHook(() =>
      useDraggable(wrapEl(el), { onStart: () => false })
    );

    firePointerDown(el, 10, 10);
    firePointerMove(60, 80);

    expect(result.current.isDragging$.get()).toBe(false);
    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
  });

  it("pointerTypes filter — touch ignored when only mouse allowed", async () => {
    const { result } = renderHook(() =>
      useDraggable(wrapEl(el), { pointerTypes: ["mouse"] })
    );

    // touch pointerdown — should be ignored
    firePointerDown(el, 10, 10, "touch");
    expect(result.current.isDragging$.get()).toBe(false);

    // mouse pointerdown — should work
    firePointerDown(el, 10, 10, "mouse");
    expect(result.current.isDragging$.get()).toBe(true);
  });
});
