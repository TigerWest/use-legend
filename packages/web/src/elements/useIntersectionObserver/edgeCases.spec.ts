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

describe("useIntersectionObserver() — edge cases", () => {
  it("skips null targets without throwing", () => {
    const target$ = observable<OpaqueObject<Element> | null>(null);

    expect(() => {
      renderHook(() => useIntersectionObserver(target$, vi.fn()));
    }).not.toThrow();

    // observe() must not be called on any element since target is null
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("does not throw when entries array is empty", () => {
    const el = document.createElement("div");
    let capturedCb: IntersectionObserverCallback | null = null;

    MockIntersectionObserver.mockImplementation(function (
      cb: IntersectionObserverCallback,
      init?: IntersectionObserverInit
    ) {
      void init;
      capturedCb = cb;
      return { observe: mockObserve, disconnect: mockDisconnect };
    });

    renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn()));

    expect(capturedCb).not.toBeNull();

    expect(() => {
      act(() => {
        capturedCb!([], {} as IntersectionObserver);
      });
    }).not.toThrow();
  });

  it("isActive$=false prevents observer creation", () => {
    const el = document.createElement("div");
    renderHook(() => useIntersectionObserver(wrapEl(el), vi.fn(), { immediate: false }));

    expect(MockIntersectionObserver).not.toHaveBeenCalled();
  });
});
