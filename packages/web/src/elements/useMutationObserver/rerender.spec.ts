// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useMutationObserver } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useMutationObserver() — rerender stability", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-create MutationObserver when unrelated state causes re-render", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      // Count disconnect calls — each MO recreation triggers disconnect on the old one.
      // If MO is NOT recreated on re-render, disconnect should not be called extra times.
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      const { rerender } = renderHook(() =>
        useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
      );

      const disconnectCallsAfterMount = disconnectSpy.mock.calls.length;

      rerender();
      rerender();

      // If MO was recreated, disconnect would have been called. It should not have been.
      expect(disconnectSpy.mock.calls.length).toBe(disconnectCallsAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("observer continues to detect mutations after re-render", async () => {
      const callback = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);

      const { rerender } = renderHook(() =>
        useMutationObserver(wrapEl(el), callback, { attributes: true })
      );

      rerender();
      rerender();

      await act(async () => {
        el.setAttribute("data-post-rerender", "1");
        await flush();
      });

      expect(callback).toHaveBeenCalled();
      const records: MutationRecord[] = callback.mock.calls[0][0];
      expect(records[0].type).toBe("attributes");
    });
  });

  describe("callback freshness", () => {
    it("uses stale callback after re-render — regression guard: no callbackRef pattern", async () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const { rerender } = renderHook(
        ({ cb }) => useMutationObserver(wrapEl(el), cb, { attributes: true }),
        { initialProps: { cb: cb1 } }
      );

      rerender({ cb: cb2 });

      await act(async () => {
        el.setAttribute("data-stale", "1");
        await flush();
      });

      // Observer was created with cb1 and is not recreated on re-render alone.
      // This test documents the current behavior — absence of callbackRef pattern.
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).not.toHaveBeenCalled();
    });
  });
});
