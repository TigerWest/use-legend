/**
 * useDropZone - Browser Edge Cases Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Uses native DataTransfer API (no Proxy required in real browser).
 * Edge cases that require real browser behavior (e.g. nested dragenter/dragleave counter logic).
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useDropZone } from ".";

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
    width: "200px",
    height: "200px",
  });
  document.body.style.margin = "0";
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
  document.body.style.margin = "";
});

/**
 * Creates a DragEvent with a native DataTransfer (browser-native, no Proxy).
 * Object.defineProperty is required because synthetic DragEvents have read-only dataTransfer.
 */
function createDragEvent(type: string, files: File[] = []): DragEvent {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  const event = new DragEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: dt,
    configurable: true,
  });
  return event;
}

function fireDragEvent(target: EventTarget, event: DragEvent) {
  act(() => {
    target.dispatchEvent(event);
  });
}

// ---------------------------------------------------------------------------
// useDropZone edge cases (real browser)
// ---------------------------------------------------------------------------

describe("useDropZone() — edge cases (real browser)", () => {
  it("nested dragenter/dragleave — isOverDropZone$ stays true while counter > 0", async () => {
    const { result } = renderHook(() => useDropZone(wrapEl(el)));

    // dragenter on target → counter = 1
    fireDragEvent(el, createDragEvent("dragenter"));
    await waitFor(() => expect(result.current.isOverDropZone$.get()).toBe(true));

    // dragenter again (simulating child enter) → counter = 2
    fireDragEvent(el, createDragEvent("dragenter"));
    expect(result.current.isOverDropZone$.get()).toBe(true);

    // dragleave (moved to child) → counter = 1, still over
    fireDragEvent(el, createDragEvent("dragleave"));
    expect(result.current.isOverDropZone$.get()).toBe(true);

    // dragleave (fully left) → counter = 0
    fireDragEvent(el, createDragEvent("dragleave"));
    await waitFor(() => expect(result.current.isOverDropZone$.get()).toBe(false));
  });
});
