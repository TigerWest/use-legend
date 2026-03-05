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

describe("useElementVisibility() — edge cases", () => {
  it("once: true — stops observing after first visible", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useElementVisibility(wrapEl(el), { once: true }));

    expect(result.current.get()).toBe(false);

    act(() => {
      capturedCallback([makeEntry(true)], {} as IntersectionObserver);
    });

    // Once element becomes visible, observer should be stopped
    expect(result.current.get()).toBe(true);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("custom initialValue is returned before observer fires", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useElementVisibility(wrapEl(el), { initialValue: true }));

    // initialValue: true should be the starting value before any IO entry fires
    expect(result.current.get()).toBe(true);
  });
});
