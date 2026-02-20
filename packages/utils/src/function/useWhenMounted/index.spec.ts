// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWhenMounted } from ".";

// Shared observable that controls the mocked isMounted state.
// Initialized in beforeEach so each test starts with a fresh observable.
let isMounted$: ReturnType<typeof observable<boolean>>;

vi.mock("@legendapp/state/react", async () => {
  const actual = await import("@legendapp/state/react");
  return {
    ...actual,
    // Return the shared observable lazily — evaluated at call time, not setup time
    useIsMounted: () => isMounted$,
  };
});

beforeEach(() => {
  isMounted$ = observable(true); // default: mounted
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useWhenMounted — return value
// ---------------------------------------------------------------------------

describe("useWhenMounted() — return value", () => {
  it("returns an Observable", () => {
    const { result } = renderHook(() => useWhenMounted(() => "hello"));
    expect(typeof result.current.get).toBe("function");
  });

  it("returns the callback value when mounted", () => {
    const { result } = renderHook(() => useWhenMounted(() => "hello"));
    expect(result.current.get()).toBe("hello");
  });

  it("returns undefined when not mounted", () => {
    isMounted$.set(false);
    const { result } = renderHook(() => useWhenMounted(() => "hello"));
    expect(result.current.get()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// useWhenMounted — type preservation (no boolean coercion)
// ---------------------------------------------------------------------------

describe("useWhenMounted() — type preservation", () => {
  it("returns false as-is (no boolean coercion)", () => {
    const { result } = renderHook(() => useWhenMounted(() => false));
    expect(result.current.get()).toBe(false);
  });

  it("returns 0 as-is", () => {
    const { result } = renderHook(() => useWhenMounted(() => 0));
    expect(result.current.get()).toBe(0);
  });

  it("returns a string as-is", () => {
    const { result } = renderHook(() => useWhenMounted(() => "value"));
    expect(result.current.get()).toBe("value");
  });

  it("returns a number as-is", () => {
    const { result } = renderHook(() => useWhenMounted(() => 42));
    expect(result.current.get()).toBe(42);
  });

  it("returns an object reference", () => {
    const obj = { foo: "bar" };
    const { result } = renderHook(() => useWhenMounted(() => obj));
    expect(result.current.get()).toEqual({ foo: "bar" });
  });

  // Legend State observables treat null as an empty/deleted value and normalize it to undefined
  it("normalizes null to undefined (Legend State behavior)", () => {
    const { result } = renderHook(() => useWhenMounted(() => null));
    expect(result.current.get()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// useWhenMounted — reactive re-evaluation
// ---------------------------------------------------------------------------

describe("useWhenMounted() — reactive re-evaluation", () => {
  it("invokes the callback when the observable value is accessed", () => {
    const callback = vi.fn(() => "value");
    const { result } = renderHook(() => useWhenMounted(callback));
    result.current.get();
    expect(callback).toHaveBeenCalled();
  });

  it("re-evaluates when a reactive dependency inside the callback changes", () => {
    const count$ = observable(1);
    const { result } = renderHook(() =>
      useWhenMounted(() => count$.get() * 2),
    );

    expect(result.current.get()).toBe(2);

    act(() => count$.set(5));
    expect(result.current.get()).toBe(10);
  });

  it("transitions from undefined to callback value when isMounted becomes true", () => {
    isMounted$.set(false);
    const { result } = renderHook(() => useWhenMounted(() => "ready"));
    expect(result.current.get()).toBeUndefined();

    act(() => isMounted$.set(true));
    expect(result.current.get()).toBe("ready");
  });
});
