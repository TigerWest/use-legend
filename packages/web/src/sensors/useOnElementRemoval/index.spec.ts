// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useOnElementRemoval } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const waitForMutation = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

describe("useOnElementRemoval()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("accepts target and callback without error", () => {
      const el = document.createElement("div");
      expect(() => renderHook(() => useOnElementRemoval(wrapEl(el), vi.fn()))).not.toThrow();
    });
  });

  describe("removal detection", () => {
    it("calls callback when target element is removed", async () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.appendChild(child);
      document.body.appendChild(parent);

      const handler = vi.fn();
      renderHook(() => useOnElementRemoval(wrapEl(child), handler));

      await waitForMutation();

      act(() => {
        parent.removeChild(child);
      });

      await waitForMutation();

      expect(handler).toHaveBeenCalledOnce();

      document.body.removeChild(parent);
    });

    it("calls callback when parent containing target is removed", async () => {
      const grandparent = document.createElement("div");
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.appendChild(child);
      grandparent.appendChild(parent);
      document.body.appendChild(grandparent);

      const handler = vi.fn();
      renderHook(() => useOnElementRemoval(wrapEl(child), handler));

      await waitForMutation();

      act(() => {
        document.body.removeChild(grandparent);
      });

      await waitForMutation();

      expect(handler).toHaveBeenCalledOnce();
    });

    it("does not call callback when unrelated element is removed", async () => {
      const target = document.createElement("div");
      const other = document.createElement("div");
      document.body.appendChild(target);
      document.body.appendChild(other);

      const handler = vi.fn();
      renderHook(() => useOnElementRemoval(wrapEl(target), handler));

      await waitForMutation();

      act(() => {
        document.body.removeChild(other);
      });

      await waitForMutation();

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(target);
    });

    it("accepts null target without error", () => {
      const handler = vi.fn();
      expect(() => renderHook(() => useOnElementRemoval(null, handler))).not.toThrow();
    });
  });

  describe("unmount cleanup", () => {
    it("disconnects observer on unmount", async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const handler = vi.fn();
      const { unmount } = renderHook(() => useOnElementRemoval(wrapEl(el), handler));

      await waitForMutation();

      unmount();
      await flush();

      act(() => {
        document.body.removeChild(el);
      });

      await waitForMutation();

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
