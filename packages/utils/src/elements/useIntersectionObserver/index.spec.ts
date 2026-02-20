// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntersectionObserver } from ".";
import { useEl$ } from "../useEl$";

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedCallback: IntersectionObserverCallback;

const MockIntersectionObserver = vi.fn(
  (cb: IntersectionObserverCallback, init?: IntersectionObserverInit) => {
    capturedCallback = cb;
    void init; // captured for assertion via toHaveBeenCalledWith
    return { observe: mockObserve, disconnect: mockDisconnect };
  },
);

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  MockIntersectionObserver.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIntersectionObserver()", () => {
  it("creates observer and observes target on mount", () => {
    const el = document.createElement("div");
    renderHook(() => useIntersectionObserver(el, vi.fn()));

    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledWith(el);
  });

  it("isSupported is true when IntersectionObserver is available", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    expect(result.current.isSupported.get()).toBe(true);
  });

  it("isActive is true by default", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    expect(result.current.isActive.get()).toBe(true);
  });

  it("does not start observer when immediate is false", () => {
    const el = document.createElement("div");
    renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { immediate: false }),
    );

    expect(MockIntersectionObserver).not.toHaveBeenCalled();
  });

  it("isActive is false when immediate is false", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { immediate: false }),
    );

    expect(result.current.isActive.get()).toBe(false);
  });

  it("pause() disconnects observer and sets isActive to false", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    act(() => {
      result.current.pause();
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(result.current.isActive.get()).toBe(false);
  });

  it("resume() restarts the observer after pause", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    act(() => result.current.pause());

    mockObserve.mockClear();
    MockIntersectionObserver.mockClear();

    act(() => result.current.resume());

    expect(result.current.isActive.get()).toBe(true);
    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledWith(el);
  });

  it("stop() permanently stops the observer", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    act(() => result.current.stop());

    expect(mockDisconnect).toHaveBeenCalled();
    expect(result.current.isActive.get()).toBe(false);
  });

  it("resume() has no effect after stop()", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    act(() => result.current.stop());
    MockIntersectionObserver.mockClear();

    act(() => result.current.resume());

    expect(MockIntersectionObserver).not.toHaveBeenCalled();
  });

  it("observes multiple targets passed as array", () => {
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    renderHook(() => useIntersectionObserver([el1, el2], vi.fn()));

    expect(mockObserve).toHaveBeenCalledWith(el1);
    expect(mockObserve).toHaveBeenCalledWith(el2);
  });

  it("works with Observable<Element | null> target", () => {
    const el = document.createElement("div");
    const el$ = observable<Element | null>(el);
    renderHook(() => useIntersectionObserver(el$, vi.fn()));

    expect(mockObserve).toHaveBeenCalledWith(el);
  });

  it("skips null targets without throwing", () => {
    const el$ = observable<Element | null>(null);
    expect(() =>
      renderHook(() => useIntersectionObserver(el$, vi.fn())),
    ).not.toThrow();
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("works with El$ target", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => {
      const el$ = useEl$<HTMLDivElement>();
      return { el$, io: useIntersectionObserver(el$, vi.fn()) };
    });

    // Assign element via act after mount
    act(() => result.current.el$(div));

    expect(result.current.io.isSupported.get()).toBe(true);
  });

  it("passes threshold option to IntersectionObserver", () => {
    const el = document.createElement("div");
    renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { threshold: 0.5 }),
    );

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 }),
    );
  });

  it("passes rootMargin option to IntersectionObserver", () => {
    const el = document.createElement("div");
    renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { rootMargin: "10px" }),
    );

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: "10px" }),
    );
  });

  it("passes Observable rootMargin to IntersectionObserver", () => {
    const el = document.createElement("div");
    const rootMargin$ = observable("20px");
    renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { rootMargin: rootMargin$ }),
    );

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: "20px" }),
    );
  });

  it("reactively recreates observer when Observable rootMargin changes", () => {
    const el = document.createElement("div");
    const rootMargin$ = observable("0px");
    renderHook(() =>
      useIntersectionObserver(el, vi.fn(), { rootMargin: rootMargin$ }),
    );

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
      expect.objectContaining({ rootMargin: "10px" }),
    );
  });

  it("disconnects observer on unmount", () => {
    const el = document.createElement("div");
    const { unmount } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("isSupported is false when IntersectionObserver is not available", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const el = document.createElement("div");
    const { result } = renderHook(() => useIntersectionObserver(el, vi.fn()));

    expect(result.current.isSupported.get()).toBe(false);
    expect(MockIntersectionObserver).not.toHaveBeenCalled();
  });

  it("invokes callback when intersection fires", () => {
    const el = document.createElement("div");
    const cb = vi.fn();
    renderHook(() => useIntersectionObserver(el, cb));

    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      capturedCallback([entry], {} as IntersectionObserver);
    });

    expect(cb).toHaveBeenCalledWith([entry], expect.anything());
  });
});
