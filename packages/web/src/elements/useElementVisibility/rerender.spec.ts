// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useElementVisibility } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedCallback: IntersectionObserverCallback;

const MockIntersectionObserver = vi.fn(function (
  cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
) {
  capturedCallback = cb;
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

function makeEntry(isIntersecting: boolean, time = 0): IntersectionObserverEntry {
  return { isIntersecting, time } as IntersectionObserverEntry;
}

describe("useElementVisibility() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-create IntersectionObserver when unrelated state causes re-render", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementVisibility(elObs$);
        },
        { initialProps: { count: 0 } }
      );

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      // IntersectionObserver must not be re-created on unrelated re-renders
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).not.toHaveBeenCalled();
    });
  });

  describe("value accuracy", () => {
    it("isVisible$ remains correct after multiple re-renders", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementVisibility(elObs$);
        },
        { initialProps: { count: 0 } }
      );

      // Fire IO callback to set visibility to true
      act(() => {
        capturedCallback([makeEntry(true)], {} as IntersectionObserver);
      });

      expect(result.current.get()).toBe(true);

      // Re-render multiple times with unrelated prop changes
      rerender({ count: 1 });
      expect(result.current.get()).toBe(true);

      rerender({ count: 2 });
      expect(result.current.get()).toBe(true);

      // Visibility update still works after re-renders
      act(() => {
        capturedCallback([makeEntry(false)], {} as IntersectionObserver);
      });
      expect(result.current.get()).toBe(false);
    });
  });
});
