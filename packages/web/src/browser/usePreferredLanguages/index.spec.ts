// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePreferredLanguages } from ".";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePreferredLanguages — return value
// ---------------------------------------------------------------------------

describe("usePreferredLanguages() — return value", () => {
  it("returns an Observable with .get()", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US", "en"]);
    const { result } = renderHook(() => usePreferredLanguages());
    expect(typeof result.current.get).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// usePreferredLanguages — initial value
// ---------------------------------------------------------------------------

describe("usePreferredLanguages() — initial value", () => {
  it("returns navigator.languages initially", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US", "en"]);
    const { result } = renderHook(() => usePreferredLanguages());
    expect(result.current.get()).toEqual(["en-US", "en"]);
  });
});

// ---------------------------------------------------------------------------
// usePreferredLanguages — change event
// ---------------------------------------------------------------------------

describe("usePreferredLanguages() — change event", () => {
  it("updates when languagechange event fires", () => {
    const langSpy = vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
    const { result } = renderHook(() => usePreferredLanguages());

    expect(result.current.get()).toEqual(["en-US"]);

    act(() => {
      langSpy.mockReturnValue(["fr-FR", "en"]);
      window.dispatchEvent(new Event("languagechange"));
    });

    expect(result.current.get()).toEqual(["fr-FR", "en"]);
  });
});

// ---------------------------------------------------------------------------
// usePreferredLanguages — cleanup
// ---------------------------------------------------------------------------

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("usePreferredLanguages() — cleanup", () => {
  it("does not update after unmount", async () => {
    const langSpy = vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
    const { result, unmount } = renderHook(() => usePreferredLanguages());

    unmount();
    await flush();

    act(() => {
      langSpy.mockReturnValue(["de-DE"]);
      window.dispatchEvent(new Event("languagechange"));
    });

    expect(result.current.get()).toEqual(["en-US"]);
  });
});
