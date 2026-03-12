/**
 * useFocusWithin - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests focusout + :focus-within behavior which requires a real browser.
 */
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useFocusWithin } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

let container: HTMLDivElement;
let input1: HTMLInputElement;
let input2: HTMLInputElement;
let external: HTMLButtonElement;

beforeEach(() => {
  container = document.createElement("div");
  input1 = document.createElement("input");
  input2 = document.createElement("input");
  external = document.createElement("button");
  external.textContent = "external";

  container.appendChild(input1);
  container.appendChild(input2);
  document.body.appendChild(container);
  document.body.appendChild(external);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
  if (external.parentNode) document.body.removeChild(external);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFocusWithin() — real browser", () => {
  it("focused$ becomes true when child receives focus", () => {
    const { result } = renderHook(() => useFocusWithin(wrapEl(container)));

    act(() => {
      input1.focus();
    });

    expect(result.current.focused$.get()).toBe(true);
  });

  it("focused$ becomes false when focus moves outside container", () => {
    const { result } = renderHook(() => useFocusWithin(wrapEl(container)));

    act(() => {
      input1.focus();
    });
    expect(result.current.focused$.get()).toBe(true);

    act(() => {
      external.focus();
    });
    expect(result.current.focused$.get()).toBe(false);
  });

  it("focused$ stays true when focus moves between children", () => {
    const { result } = renderHook(() => useFocusWithin(wrapEl(container)));

    act(() => {
      input1.focus();
    });
    expect(result.current.focused$.get()).toBe(true);

    act(() => {
      input2.focus();
    });
    expect(result.current.focused$.get()).toBe(true);
  });

  it("focused$ becomes false when active element is blurred", () => {
    const { result } = renderHook(() => useFocusWithin(wrapEl(container)));

    act(() => {
      input1.focus();
    });
    expect(result.current.focused$.get()).toBe(true);

    act(() => {
      input1.blur();
    });
    expect(result.current.focused$.get()).toBe(false);
  });

  it("full cycle: no focus → child focus → move outside → child focus again", () => {
    const { result } = renderHook(() => useFocusWithin(wrapEl(container)));

    expect(result.current.focused$.get()).toBe(false);

    act(() => {
      input1.focus();
    });
    expect(result.current.focused$.get()).toBe(true);

    act(() => {
      external.focus();
    });
    expect(result.current.focused$.get()).toBe(false);

    act(() => {
      input2.focus();
    });
    expect(result.current.focused$.get()).toBe(true);
  });
});
