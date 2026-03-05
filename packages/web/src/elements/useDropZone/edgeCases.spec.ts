// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDropZone } from ".";

// ---------------------------------------------------------------------------
// jsdom DragEvent polyfill
// ---------------------------------------------------------------------------
if (typeof window !== "undefined" && !window.DragEvent) {
  (globalThis as any).DragEvent = class DragEvent extends MouseEvent {
    dataTransfer: DataTransfer | null = null;
    constructor(type: string, init: DragEventInit = {}) {
      super(type, init);
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function createDiv() {
  return document.createElement("div");
}

function createFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

function createDragEvent(type: string, files: File[] = [], mimeTypes: string[] = []): DragEvent {
  const event = new DragEvent(type, { bubbles: true, cancelable: true });

  const items = mimeTypes.map((mime) => ({
    type: mime,
    kind: "file" as const,
  }));

  const itemsProxy = new Proxy(items, {
    get(target, prop) {
      if (prop === "length") return target.length;
      if (prop === Symbol.iterator) return target[Symbol.iterator].bind(target);
      const idx = Number(prop);
      if (!isNaN(idx)) return target[idx];
      return undefined;
    },
  }) as unknown as DataTransferItemList;

  const filesProxy = new Proxy(files, {
    get(target, prop) {
      if (prop === "length") return target.length;
      if (prop === Symbol.iterator) return target[Symbol.iterator].bind(target);
      const idx = Number(prop);
      if (!isNaN(idx)) return target[idx];
      return undefined;
    },
  }) as unknown as FileList;

  const dataTransfer = {
    items: itemsProxy,
    files: filesProxy,
    dropEffect: "none" as DataTransfer["dropEffect"],
  };

  Object.defineProperty(event, "dataTransfer", {
    value: dataTransfer,
    writable: true,
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
// useDropZone — edge cases
// ---------------------------------------------------------------------------

describe("useDropZone() — edge cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dragleave counter does not underflow below 0", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDropZone(wrapEl(div) as any));

    // Fire dragleave without any prior dragenter — counter was 0
    fireDragEvent(div, createDragEvent("dragleave", [], []));
    fireDragEvent(div, createDragEvent("dragleave", [], []));

    // isOverDropZone$ must stay false (no underflow into negative counter)
    expect(result.current.isOverDropZone$.get()).toBe(false);

    // Verify a subsequent dragenter still works correctly
    fireDragEvent(div, createDragEvent("dragenter", [], []));
    expect(result.current.isOverDropZone$.get()).toBe(true);
  });

  it("drop with empty DataTransfer keeps files$ null", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDropZone(wrapEl(div) as any));

    // Drop with no files and no mime types
    fireDragEvent(div, createDragEvent("drop", [], []));

    expect(result.current.files$.get()).toBeNull();
  });

  it("dataTypes array — mismatched type keeps files$ null", () => {
    const div = createDiv();
    const { result } = renderHook(() =>
      useDropZone(wrapEl(div) as any, { dataTypes: ["image/png"] })
    );

    const textFile = createFile("doc.txt", "text/plain");
    fireDragEvent(div, createDragEvent("drop", [textFile], ["text/plain"]));

    expect(result.current.files$.get()).toBeNull();
  });

  it("multiple dragenter events increment counter correctly", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDropZone(wrapEl(div) as any));

    // Simulate nested child elements causing multiple dragenter events
    fireDragEvent(div, createDragEvent("dragenter", [], []));
    fireDragEvent(div, createDragEvent("dragenter", [], []));
    fireDragEvent(div, createDragEvent("dragenter", [], []));

    // isOverDropZone$ must remain true (counter = 3)
    expect(result.current.isOverDropZone$.get()).toBe(true);

    // Two dragleaves — counter goes from 3 to 1, still over
    fireDragEvent(div, createDragEvent("dragleave", [], []));
    fireDragEvent(div, createDragEvent("dragleave", [], []));
    expect(result.current.isOverDropZone$.get()).toBe(true);

    // Final dragleave — counter reaches 0
    fireDragEvent(div, createDragEvent("dragleave", [], []));
    expect(result.current.isOverDropZone$.get()).toBe(false);
  });

  it("SVG element target is supported", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(svg));

    expect(() => {
      renderHook(() => useDropZone(target$ as any));
    }).not.toThrow();

    // Verify listeners are attached to the SVG element
    const addSpy = vi.spyOn(svg, "addEventListener");

    const target2$ = observable<OpaqueObject<Element> | null>(null);
    renderHook(() => useDropZone(target2$ as any));

    act(() => target2$.set(ObservableHint.opaque(svg)));

    expect(addSpy.mock.calls.map((c) => c[0])).toContain("dragenter");
  });
});
