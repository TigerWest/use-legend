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

describe("useIntersectionObserver() — reactive options", () => {
  describe("Observable option change", () => {
    it("reactively recreates observer when Observable rootMargin changes", () => {
      const el = document.createElement("div");
      const rootMargin$ = observable("0px");
      renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn(), { rootMargin: rootMargin$ }));

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => {
        rootMargin$.set("10px");
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ rootMargin: "10px" })
      );
    });

    it("reactively recreates observer when Observable root changes from null to element", () => {
      const el = document.createElement("div");
      const rootB = document.createElement("div");
      // Start with null — @legendapp/state reliably tracks null→element transitions
      const root$ = observable<OpaqueObject<Element> | null>(null);

      renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn(), { root: root$ }));

      // root is null — observer must not be created yet
      expect(MockIntersectionObserver).not.toHaveBeenCalled();
      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => {
        root$.set(ObservableHint.opaque(rootB));
      });

      // no old observer to disconnect; new one created with rootB
      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: rootB })
      );
    });

    it("reactively recreates observer when Observable root changes from element to element", () => {
      const el = document.createElement("div");
      const rootA = document.createElement("div");
      const rootB = document.createElement("div");
      const root$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(rootA));

      renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn(), { root: root$ }));

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: rootA })
      );

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => {
        root$.set(ObservableHint.opaque(rootB));
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: rootB })
      );
    });

    it("observer observes correct target after Observable rootMargin changes", () => {
      const el = document.createElement("div");
      const rootMargin$ = observable("0px");
      renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn(), { rootMargin: rootMargin$ }));

      mockObserve.mockClear();

      act(() => {
        rootMargin$.set("20px");
      });

      // New observer must observe the same target element
      expect(mockObserve).toHaveBeenCalledWith(el);
    });
  });
});
