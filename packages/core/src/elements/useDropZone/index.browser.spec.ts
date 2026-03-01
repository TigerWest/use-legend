/**
 * useDropZone - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Uses native DataTransfer API (no Proxy required in real browser).
 * Type-A tests only: real DragEvent + real DataTransfer file/type validation.
 * Type-B/C tests remain in index.spec.ts (jsdom).
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDropZone } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) =>
  observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

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
// useDropZone browser tests (Type-A only)
// ---------------------------------------------------------------------------

describe("useDropZone() — real browser", () => {
  it("valid file drop is detected — files$ updated and isOverDropZone$ reset", async () => {
    const { result } = renderHook(() =>
      useDropZone(wrapEl(el), { dataTypes: ["image/png"] }),
    );

    const file = new File(["content"], "image.png", { type: "image/png" });
    fireDragEvent(el, createDragEvent("drop", [file]));

    await waitFor(() => expect(result.current.files$.get()).toHaveLength(1));
    expect(result.current.files$.get()![0].type).toBe("image/png");
    expect(result.current.isOverDropZone$.get()).toBe(false);
  });

  it("invalid file type is filtered — files$ stays null and onDrop called with null", async () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() =>
      useDropZone(wrapEl(el), { dataTypes: ["image/png"], onDrop }),
    );

    const file = new File(["content"], "doc.txt", { type: "text/plain" });
    fireDragEvent(el, createDragEvent("drop", [file]));

    await waitFor(() => expect(onDrop).toHaveBeenCalledTimes(1));
    expect(result.current.files$.get()).toBeNull();
    expect(onDrop.mock.calls[0][0]).toBeNull();
  });

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

  it("dragenter sets isOverDropZone$ true, drop resets it false and updates files$", async () => {
    const { result } = renderHook(() => useDropZone(wrapEl(el)));

    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

    fireDragEvent(el, createDragEvent("dragenter"));
    await waitFor(() => expect(result.current.isOverDropZone$.get()).toBe(true));

    fireDragEvent(el, createDragEvent("drop", [file]));
    await waitFor(() => expect(result.current.isOverDropZone$.get()).toBe(false));
    expect(result.current.files$.get()).toHaveLength(1);
  });
});
