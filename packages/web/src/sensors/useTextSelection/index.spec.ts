// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useTextSelection } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useTextSelection()", () => {
  let mockSelection: {
    toString: ReturnType<typeof vi.fn>;
    rangeCount: number;
    getRangeAt: ReturnType<typeof vi.fn>;
  };
  let mockRange: {
    getBoundingClientRect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRange = {
      getBoundingClientRect: vi.fn(() => ({
        x: 10,
        y: 20,
        width: 100,
        height: 16,
        top: 20,
        right: 110,
        bottom: 36,
        left: 10,
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

  describe("return shape", () => {
    it("returns observable fields", () => {
      const { result } = renderHook(() => useTextSelection());
      expect(typeof result.current.text$.get).toBe("function");
      expect(typeof result.current.rects$.get).toBe("function");
      expect(typeof result.current.ranges$.get).toBe("function");
      expect(typeof result.current.selection$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("text$ is empty string initially", () => {
      const { result } = renderHook(() => useTextSelection());
      expect(result.current.text$.get()).toBe("");
    });

    it("rects$ is empty array initially", () => {
      const { result } = renderHook(() => useTextSelection());
      expect(result.current.rects$.get()).toEqual([]);
    });

    it("ranges$ is empty array initially", () => {
      const { result } = renderHook(() => useTextSelection());
      expect(result.current.ranges$.get()).toEqual([]);
    });
  });

  describe("selection tracking", () => {
    it("updates text$ on selectionchange", () => {
      const { result } = renderHook(() => useTextSelection());

      mockSelection.toString.mockReturnValue("Hello World");
      mockSelection.rangeCount = 1;

      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      expect(result.current.text$.get()).toBe("Hello World");
    });

    it("updates ranges$ on selectionchange", () => {
      const { result } = renderHook(() => useTextSelection());

      mockSelection.rangeCount = 1;

      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      expect(result.current.ranges$.get()).toHaveLength(1);
    });

    it("updates rects$ on selectionchange", () => {
      const { result } = renderHook(() => useTextSelection());

      mockSelection.rangeCount = 1;

      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      const rects = result.current.rects$.get();
      expect(rects).toHaveLength(1);
      expect(rects[0].x).toBe(10);
      expect(rects[0].y).toBe(20);
    });

    it("handles multiple ranges", () => {
      const { result } = renderHook(() => useTextSelection());

      mockSelection.rangeCount = 2;
      mockSelection.toString.mockReturnValue("Multi range");

      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      expect(result.current.ranges$.get()).toHaveLength(2);
      expect(result.current.rects$.get()).toHaveLength(2);
    });

    it("updates selection$ with the Selection object on selectionchange", () => {
      const { result } = renderHook(() => useTextSelection());

      mockSelection.rangeCount = 1;
      mockSelection.toString.mockReturnValue("selected");

      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      const sel = result.current.selection$.get();
      expect(sel).not.toBeNull();
      // opaque wrapper: the underlying value should be the mock selection
      expect((sel as any).toString()).toBe("selected");
    });

    it("resets when selection is null", () => {
      const { result } = renderHook(() => useTextSelection());

      // First, set some selection
      mockSelection.toString.mockReturnValue("text");
      mockSelection.rangeCount = 1;
      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });
      expect(result.current.text$.get()).toBe("text");

      // Then clear selection
      vi.spyOn(window, "getSelection").mockImplementation(() => null);
      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });

      expect(result.current.text$.get()).toBe("");
      expect(result.current.ranges$.get()).toEqual([]);
      expect(result.current.rects$.get()).toEqual([]);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listener on unmount", async () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useTextSelection());
      unmount();
      await flush();

      expect(addSpy.mock.calls.some(([t]) => t === "selectionchange")).toBe(true);
      expect(removeSpy.mock.calls.some(([t]) => t === "selectionchange")).toBe(true);
    });
  });
});
