// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTextSelection } from ".";

describe("useTextSelection() — rerender stability", () => {
  let mockSelection: {
    toString: ReturnType<typeof vi.fn>;
    rangeCount: number;
    getRangeAt: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSelection = {
      toString: vi.fn(() => "stable text"),
      rangeCount: 1,
      getRangeAt: vi.fn(() => ({
        getBoundingClientRect: vi.fn(() => ({
          x: 0,
          y: 0,
          width: 50,
          height: 12,
          top: 0,
          right: 50,
          bottom: 12,
          left: 0,
          toJSON: vi.fn(),
        })),
      })),
    };
    vi.spyOn(window, "getSelection").mockImplementation(() => mockSelection as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useTextSelection());
    const first = result.current;
    rerender();
    expect(result.current.text$).toBe(first.text$);
    expect(result.current.rects$).toBe(first.rects$);
    expect(result.current.ranges$).toBe(first.ranges$);
    expect(result.current.selection$).toBe(first.selection$);
  });

  it("values persist across re-renders", () => {
    const { result, rerender } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(result.current.text$.get()).toBe("stable text");
    rerender();
    expect(result.current.text$.get()).toBe("stable text");
  });

  it("does not re-register event listeners on re-render", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    const { rerender } = renderHook(() => useTextSelection());
    const countAfterMount = addSpy.mock.calls.filter(([type]) => type === "selectionchange").length;

    rerender();
    rerender();

    const countAfterRerenders = addSpy.mock.calls.filter(
      ([type]) => type === "selectionchange"
    ).length;

    expect(countAfterRerenders).toBe(countAfterMount);
  });
});
