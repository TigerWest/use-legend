/**
 * useMouseInElement - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Contains type-A tests only: real MouseEvent + real DOM layout validation.
 * Type-B/C/D tests remain in index.spec.ts (jsdom).
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useMouseInElement } from ".";

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
});

function fireMouseMove(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
// useMouseInElement browser tests
// ---------------------------------------------------------------------------

describe("useMouseInElement() — real browser", () => {
  it("mousemove inside element → updates elementX/Y and isOutside = false", async () => {
    // el: position:absolute, left:0, top:0, width:100px, height:100px
    // margin:0, padding:0 → element occupies viewport (0,0)-(100,100)
    const { result } = renderHook(() => useMouseInElement(wrapEl(el) as any));

    fireMouseMove(60, 70); // inside: 0≤60≤100, 0≤70≤100

    await waitFor(() => expect(result.current.isOutside$.get()).toBe(false), {
      timeout: 2000,
    });

    // elementX = clientX - rect.left = 60 - 0 = 60
    // elementY = clientY - rect.top  = 70 - 0 = 70
    expect(result.current.elementX$.get()).toBe(60);
    expect(result.current.elementY$.get()).toBe(70);
  });

  it("mousemove outside element → isOutside = true", async () => {
    const { result } = renderHook(() => useMouseInElement(wrapEl(el) as any));

    // First: enter the element
    fireMouseMove(50, 50);
    await waitFor(() => expect(result.current.isOutside$.get()).toBe(false), {
      timeout: 2000,
    });

    // Then: leave the element
    fireMouseMove(500, 500);
    await waitFor(() => expect(result.current.isOutside$.get()).toBe(true), {
      timeout: 2000,
    });
  });

  it("window scroll triggers automatic recalculation — isOutside updates without another mousemove", async () => {
    // Make page scrollable
    document.body.style.height = "2000px";
    document.body.style.position = "relative";

    // Position element 200px from top of page
    el.style.top = "200px";
    // At scrollY=0: element occupies viewport y 200–300

    const { result } = renderHook(() => useMouseInElement(wrapEl(el) as any));

    // Move mouse inside element (clientY=250 is within 200–300)
    fireMouseMove(50, 250);
    await waitFor(() => expect(result.current.isOutside$.get()).toBe(false), {
      timeout: 2000,
    });

    // Scroll page down 100px:
    //   element moves to viewport y 100–200 (top=100, bottom=200)
    //   mouse still remembered at clientY=250 → now outside (250 > 200)
    // The scroll event triggers update() → isOutside auto-corrects to true
    window.scrollTo(0, 100);

    await waitFor(() => expect(result.current.isOutside$.get()).toBe(true), {
      timeout: 2000,
    });

    // Cleanup
    document.body.style.height = "";
    document.body.style.position = "";
    window.scrollTo(0, 0);
  });
});
