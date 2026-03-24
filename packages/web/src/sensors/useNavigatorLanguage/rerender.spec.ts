// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useNavigatorLanguage } from ".";

describe("useNavigatorLanguage() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useNavigatorLanguage());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.language$).toBe(first.language$);
  });

  it("language value persists across re-renders", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { result, rerender } = renderHook(() => useNavigatorLanguage());
    expect(result.current.language$.get()).toBe("en-US");
    rerender();
    expect(result.current.language$.get()).toBe("en-US");
  });

  it("languagechange still works after re-render", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    const { result, rerender } = renderHook(() => useNavigatorLanguage());
    rerender();

    act(() => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
      window.dispatchEvent(new Event("languagechange"));
    });

    expect(result.current.language$.get()).toBe("fr-FR");
  });
});
