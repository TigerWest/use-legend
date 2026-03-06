import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLocalStorage } from ".";

beforeEach(() => {
  localStorage.clear();
});

describe("useLocalStorage()", () => {
  it("returns defaults when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("ls-key", "default"));
    expect(result.current.get()).toBe("default");
  });

  it("updates value via .set()", () => {
    const { result } = renderHook(() => useLocalStorage("ls-key", "default"));

    act(() => {
      result.current.set("new-value");
    });
    expect(result.current.get()).toBe("new-value");
  });

  it("persists object values", () => {
    const { result } = renderHook(() => useLocalStorage("ls-obj", { count: 0, name: "test" }));

    act(() => {
      result.current.set({ count: 42, name: "updated" });
    });
    expect(result.current.get()).toEqual({ count: 42, name: "updated" });
  });

  it("handles number defaults", () => {
    const { result } = renderHook(() => useLocalStorage("ls-num", 42));
    expect(result.current.get()).toBe(42);
  });

  it("handles boolean defaults", () => {
    const { result } = renderHook(() => useLocalStorage("ls-bool", true));
    expect(result.current.get()).toBe(true);
  });
});
