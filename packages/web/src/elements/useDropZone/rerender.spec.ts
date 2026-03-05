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
  (global as any).DragEvent = class DragEvent extends MouseEvent {
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
// useDropZone — rerender stability
// ---------------------------------------------------------------------------

describe("useDropZone() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register drag event listeners when unrelated state causes re-render", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDropZone(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      const callCountAfterMount = addSpy.mock.calls.length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      // addEventListener must not be called again after re-renders
      expect(addSpy.mock.calls.length).toBe(callCountAfterMount);
    });

    it("dragenter/dragleave/dragover/drop listeners are not re-added on re-render", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDropZone(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      const registeredEventsAfterMount = addSpy.mock.calls.map((call) => call[0]);

      // Should have registered the 4 drag event types exactly once
      expect(registeredEventsAfterMount).toContain("dragenter");
      expect(registeredEventsAfterMount).toContain("dragleave");
      expect(registeredEventsAfterMount).toContain("dragover");
      expect(registeredEventsAfterMount).toContain("drop");

      addSpy.mockClear();

      rerender({ count: 1 });
      rerender({ count: 2 });

      // No additional addEventListener calls on re-render
      expect(addSpy).not.toHaveBeenCalled();
    });
  });

  describe("value accuracy", () => {
    it("isOverDropZone$ remains correct after re-render", () => {
      const div = createDiv();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDropZone(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      fireDragEvent(div, createDragEvent("dragenter", [], []));
      expect(result.current.isOverDropZone$.get()).toBe(true);

      rerender({ count: 1 });

      expect(result.current.isOverDropZone$.get()).toBe(true);
    });

    it("files$ state is preserved after re-render", () => {
      const div = createDiv();
      const file = createFile("a.png", "image/png");

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDropZone(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      fireDragEvent(div, createDragEvent("drop", [file], ["image/png"]));
      expect(result.current.files$.get()).toHaveLength(1);

      rerender({ count: 1 });

      expect(result.current.files$.get()).toHaveLength(1);
      expect(result.current.files$.get()![0].name).toBe("a.png");
    });

    it("drag counter (counter ref) is preserved during re-render", () => {
      const div = createDiv();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDropZone(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // dragenter twice → counter = 2, isOverDropZone$ = true
      fireDragEvent(div, createDragEvent("dragenter", [], []));
      fireDragEvent(div, createDragEvent("dragenter", [], []));
      expect(result.current.isOverDropZone$.get()).toBe(true);

      rerender({ count: 1 });

      // dragleave once → counter = 1, still over (counter preserved across re-render)
      fireDragEvent(div, createDragEvent("dragleave", [], []));
      expect(result.current.isOverDropZone$.get()).toBe(true);

      // dragleave again → counter = 0, no longer over
      fireDragEvent(div, createDragEvent("dragleave", [], []));
      expect(result.current.isOverDropZone$.get()).toBe(false);
    });
  });

  describe("callback freshness", () => {
    it("onDrop callback uses latest closure after re-render", () => {
      const div = createDiv();
      const file = createFile("a.png", "image/png");

      let capturedValue = "initial";

      const { rerender } = renderHook(
        (props: { label: string }) => {
          return useDropZone(wrapEl(div) as any, {
            onDrop: () => {
              capturedValue = props.label;
            },
          });
        },
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      fireDragEvent(div, createDragEvent("drop", [file], ["image/png"]));

      expect(capturedValue).toBe("updated");
    });

    it("onEnter/onLeave/onOver callbacks use latest closure after re-render", () => {
      const div = createDiv();

      let enterLabel = "";
      let leaveLabel = "";
      let overLabel = "";

      const { rerender } = renderHook(
        (props: { label: string }) => {
          return useDropZone(wrapEl(div) as any, {
            onEnter: () => {
              enterLabel = props.label;
            },
            onLeave: () => {
              leaveLabel = props.label;
            },
            onOver: () => {
              overLabel = props.label;
            },
          });
        },
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      fireDragEvent(div, createDragEvent("dragenter", [], []));
      fireDragEvent(div, createDragEvent("dragover", [], []));
      fireDragEvent(div, createDragEvent("dragleave", [], []));

      expect(enterLabel).toBe("updated");
      expect(overLabel).toBe("updated");
      expect(leaveLabel).toBe("updated");
    });
  });
});
