import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStorage } from ".";

beforeEach(() => {
  sessionStorage.clear();
});

describe("useSessionStorage()", () => {
  it("returns defaults when sessionStorage is empty", () => {
    const { result } = renderHook(() => useSessionStorage("ss-key", "default"));
    expect(result.current.get()).toBe("default");
  });

  it("updates value via .set()", () => {
    const { result } = renderHook(() => useSessionStorage("ss-key", "default"));

    act(() => {
      result.current.set("new-value");
    });
    expect(result.current.get()).toBe("new-value");
  });

  it("persists object values", () => {
    const { result } = renderHook(() => useSessionStorage("ss-obj", { step: 1 }));

    act(() => {
      result.current.set({ step: 3 });
    });
    expect(result.current.get()).toEqual({ step: 3 });
  });

  it("handles number defaults", () => {
    const { result } = renderHook(() => useSessionStorage("ss-num", 99));
    expect(result.current.get()).toBe(99);
  });

  it("handles boolean defaults", () => {
    const { result } = renderHook(() => useSessionStorage("ss-bool", false));
    expect(result.current.get()).toBe(false);
  });
});
