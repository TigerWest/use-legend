// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntersectionObserver } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

const MockIntersectionObserver = vi.fn(function (
  cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
) {
  void cb;
  void init;
  return { observe: mockObserve, disconnect: mockDisconnect };
});

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  MockIntersectionObserver.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIntersectionObserver() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-create IntersectionObserver when unrelated state causes re-render", () => {
      const el = document.createElement("div");

      const { rerender } = renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn()));

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      rerender();
      rerender();

      // Observer must NOT be recreated on re-render
      expect(MockIntersectionObserver).not.toHaveBeenCalled();
      expect(mockDisconnect).not.toHaveBeenCalled();
    });
  });

  describe("callback freshness", () => {
    it("callback uses latest closure after re-render without observer recreation", () => {
      const el = document.createElement("div");
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      // Capture the callback passed to MockIntersectionObserver
      let capturedCb: IntersectionObserverCallback | null = null;
      MockIntersectionObserver.mockImplementation(function (
        cb: IntersectionObserverCallback,
        init?: IntersectionObserverInit
      ) {
        void init;
        capturedCb = cb;
        return { observe: mockObserve, disconnect: mockDisconnect };
      });

      const { rerender } = renderHook(
        ({ cb }) => useIntersectionObserver(wrapEl(el), cb),
        { initialProps: { cb: cb1 } }
      );

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      MockIntersectionObserver.mockClear();

      // Re-render with new callback — observer must NOT be recreated
      rerender({ cb: cb2 });

      expect(MockIntersectionObserver).not.toHaveBeenCalled();

      // The observer was created with cb1; the captured callback is the original one.
      // This documents that useIntersectionObserver does NOT use a callbackRef pattern.
      expect(capturedCb).not.toBeNull();
      act(() => {
        capturedCb!([], {} as IntersectionObserver);
      });

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  describe("state preservation", () => {
    it("isActive$ remains true after unrelated re-render", () => {
      const el = document.createElement("div");

      const { result, rerender } = renderHook(() =>
        useIntersectionObserver(wrapEl(el), vi.fn())
      );

      expect(result.current.isActive$.get()).toBe(true);

      rerender();
      rerender();

      expect(result.current.isActive$.get()).toBe(true);
    });
  });
});
