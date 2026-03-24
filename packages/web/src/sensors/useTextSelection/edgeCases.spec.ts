// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTextSelection } from ".";

describe("useTextSelection() — edge cases", () => {
  let mockRange: {
    getBoundingClientRect: ReturnType<typeof vi.fn>;
  };
  let mockSelection: {
    toString: ReturnType<typeof vi.fn>;
    rangeCount: number;
    getRangeAt: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRange = {
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
    };
    mockSelection = {
      toString: vi.fn(() => ""),
      rangeCount: 0,
      getRangeAt: vi.fn(() => mockRange),
    };
    vi.spyOn(window, "getSelection").mockImplementation(
      () => mockSelection as unknown as Selection
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rangeCount=0 with non-null selection yields empty rects$ and ranges$", () => {
    const { result } = renderHook(() => useTextSelection());

    mockSelection.rangeCount = 0;
    mockSelection.toString.mockReturnValue("some text");

    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    // text$ reflects toString() but ranges/rects are empty
    expect(result.current.text$.get()).toBe("some text");
    expect(result.current.ranges$.get()).toHaveLength(0);
    expect(result.current.rects$.get()).toHaveLength(0);
  });

  it("rapid selectionchange events reflect only the latest value", () => {
    const { result } = renderHook(() => useTextSelection());

    act(() => {
      mockSelection.toString.mockReturnValue("first");
      mockSelection.rangeCount = 1;
      document.dispatchEvent(new Event("selectionchange"));

      mockSelection.toString.mockReturnValue("second");
      document.dispatchEvent(new Event("selectionchange"));

      mockSelection.toString.mockReturnValue("final");
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(result.current.text$.get()).toBe("final");
  });

  it("selection$.get() returns the Selection object (not null) after selectionchange", () => {
    const { result } = renderHook(() => useTextSelection());

    mockSelection.rangeCount = 1;
    mockSelection.toString.mockReturnValue("hello");

    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    const sel = result.current.selection$.get();
    expect(sel).not.toBeNull();
    // The opaque wrapper exposes the original selection via toString
    expect((sel as any).toString()).toBe("hello");
  });

  it("does not throw when selectionchange fires after unmount", () => {
    const { unmount } = renderHook(() => useTextSelection());

    unmount();

    expect(() => {
      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });
    }).not.toThrow();
  });

  it("alternating select / clear does not leave stale state", () => {
    const { result } = renderHook(() => useTextSelection());

    // select
    mockSelection.rangeCount = 1;
    mockSelection.toString.mockReturnValue("abc");
    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    expect(result.current.text$.get()).toBe("abc");

    // clear
    vi.spyOn(window, "getSelection").mockImplementation(() => null);
    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    expect(result.current.text$.get()).toBe("");
    expect(result.current.selection$.get()).toBeNull();

    // select again
    vi.spyOn(window, "getSelection").mockImplementation(
      () => mockSelection as unknown as Selection
    );
    mockSelection.toString.mockReturnValue("xyz");
    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });
    expect(result.current.text$.get()).toBe("xyz");
    expect(result.current.selection$.get()).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Lazy rects$
  // ---------------------------------------------------------------------------

  it("does not call getBoundingClientRect when rects$ is never accessed", () => {
    mockSelection.rangeCount = 1;
    mockSelection.toString.mockReturnValue("hello");

    const { result } = renderHook(() => useTextSelection());

    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    // rects$ never accessed — no reflow
    expect(mockRange.getBoundingClientRect).not.toHaveBeenCalled();

    // accessing rects$ triggers getBoundingClientRect lazily
    result.current.rects$.get();
    expect(mockRange.getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // throttle option
  // ---------------------------------------------------------------------------

  it("throttle option: leading call fires immediately, subsequent calls within window are suppressed", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useTextSelection({ throttle: 100 }));

    mockSelection.rangeCount = 1;
    mockSelection.toString.mockReturnValue("throttled");

    act(() => {
      document.dispatchEvent(new Event("selectionchange")); // leading — fires immediately
      document.dispatchEvent(new Event("selectionchange")); // suppressed
      document.dispatchEvent(new Event("selectionchange")); // suppressed
    });

    expect(result.current.text$.get()).toBe("throttled");

    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // debounce option
  // ---------------------------------------------------------------------------

  it("debounce option: defers handler until after wait period", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useTextSelection({ debounce: 100 }));

    mockSelection.rangeCount = 1;
    mockSelection.toString.mockReturnValue("debounced");

    act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    // not yet executed
    expect(result.current.text$.get()).toBe("");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.text$.get()).toBe("debounced");

    vi.useRealTimers();
  });
});
