// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useSupported } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useSupported — return value
// ---------------------------------------------------------------------------

describe("useSupported() — return value", () => {
  it("returns an Observable", () => {
    const { result } = renderHook(() => useSupported(() => true));
    expect(typeof result.current.get).toBe("function");
  });

  it("returns true when callback returns a truthy value", () => {
    const { result } = renderHook(() => useSupported(() => true));
    expect(result.current.get()).toBe(true);
  });

  it("returns false when callback returns a falsy value", () => {
    const { result } = renderHook(() => useSupported(() => false));
    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useSupported — Boolean coercion
// ---------------------------------------------------------------------------

describe("useSupported() — Boolean coercion", () => {
  it("coerces a non-empty string to true", () => {
    const { result } = renderHook(() => useSupported(() => "supported"));
    expect(result.current.get()).toBe(true);
  });

  it("coerces an object to true", () => {
    const { result } = renderHook(() => useSupported(() => ({})));
    expect(result.current.get()).toBe(true);
  });

  it("coerces 1 to true", () => {
    const { result } = renderHook(() => useSupported(() => 1));
    expect(result.current.get()).toBe(true);
  });

  it("coerces 0 to false", () => {
    const { result } = renderHook(() => useSupported(() => 0));
    expect(result.current.get()).toBe(false);
  });

  it("coerces null to false", () => {
    const { result } = renderHook(() => useSupported(() => null));
    expect(result.current.get()).toBe(false);
  });

  it("coerces undefined to false", () => {
    const { result } = renderHook(() => useSupported(() => undefined));
    expect(result.current.get()).toBe(false);
  });

  it("coerces empty string to false", () => {
    const { result } = renderHook(() => useSupported(() => ""));
    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useSupported — mount re-evaluation
// ---------------------------------------------------------------------------

describe("useSupported() — mount re-evaluation", () => {
  it("invokes the callback when the observable value is accessed", () => {
    // useObservable with a selector is lazy — callback runs on .get(), not at creation
    const callback = vi.fn(() => true);
    const { result } = renderHook(() => useSupported(callback));
    result.current.get();
    expect(callback).toHaveBeenCalled();
  });

  it("re-evaluates when a reactive dependency inside the callback changes", () => {
    // callback reads an observable — Legend State tracks it as a dependency
    const flag$ = observable(false);
    const { result } = renderHook(() => useSupported(() => flag$.get()));

    expect(result.current.get()).toBe(false);

    act(() => flag$.set(true));
    expect(result.current.get()).toBe(true);
  });

  it("reflects a browser API check after mount", () => {
    const { result } = renderHook(() =>
      useSupported(() => "matchMedia" in window),
    );
    expect(result.current.get()).toBe(true);
  });

  it("returns false for an unavailable browser API after mount", () => {
    const win = globalThis.window as any;
    const original = win.matchMedia;
    delete win.matchMedia;

    const { result } = renderHook(() =>
      useSupported(() => "matchMedia" in window),
    );
    expect(result.current.get()).toBe(false);

    win.matchMedia = original;
  });
});
