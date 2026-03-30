// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { usePointerLock } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("usePointerLock()", () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement("div");
    // Mock requestPointerLock on element
    mockElement.requestPointerLock = vi.fn();
    // Mock pointerLockElement on document
    Object.defineProperty(document, "pointerLockElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    // Mock exitPointerLock on document
    document.exitPointerLock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (document as any).pointerLockElement;
  });

  describe("return shape", () => {
    it("returns observable fields and lock/unlock functions", () => {
      const { result } = renderHook(() => usePointerLock());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.element$.get).toBe("function");
      expect(typeof result.current.lock).toBe("function");
      expect(typeof result.current.unlock).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when pointerLockElement exists on document", () => {
      const { result } = renderHook(() => usePointerLock());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("element$ is null initially", () => {
      const { result } = renderHook(() => usePointerLock());
      expect(result.current.element$.get()).toBeNull();
    });
  });

  describe("lock", () => {
    it("calls requestPointerLock on the target element", () => {
      const { result } = renderHook(() => usePointerLock());

      act(() => {
        result.current.lock(mockElement);
      });

      expect(mockElement.requestPointerLock).toHaveBeenCalled();
    });

    it("calls requestPointerLock on event's currentTarget when called with an Event", () => {
      const { result } = renderHook(() => usePointerLock());
      const mockEvent = new Event("click");
      Object.defineProperty(mockEvent, "currentTarget", { value: mockElement });

      act(() => {
        result.current.lock(mockEvent);
      });

      expect(mockElement.requestPointerLock).toHaveBeenCalled();
    });

    it("updates element$ on pointerlockchange event", () => {
      const { result } = renderHook(() => usePointerLock());

      act(() => {
        result.current.lock(mockElement);
      });

      // Simulate browser granting the lock
      act(() => {
        (document as any).pointerLockElement = mockElement;
        document.dispatchEvent(new Event("pointerlockchange"));
      });

      expect(result.current.element$.get()).toBe(mockElement);
    });
  });

  describe("unlock", () => {
    it("calls document.exitPointerLock", () => {
      const { result } = renderHook(() => usePointerLock());

      // First lock
      act(() => {
        result.current.lock(mockElement);
      });
      act(() => {
        (document as any).pointerLockElement = mockElement;
        document.dispatchEvent(new Event("pointerlockchange"));
      });

      // Then unlock
      act(() => {
        result.current.unlock();
      });

      expect(document.exitPointerLock).toHaveBeenCalled();
    });

    it("does nothing when no element is locked", () => {
      const { result } = renderHook(() => usePointerLock());

      act(() => {
        result.current.unlock();
      });

      expect(document.exitPointerLock).not.toHaveBeenCalled();
    });

    it("resets element$ to null on pointerlockchange after unlock", () => {
      const { result } = renderHook(() => usePointerLock());

      // Lock
      act(() => {
        result.current.lock(mockElement);
      });
      act(() => {
        (document as any).pointerLockElement = mockElement;
        document.dispatchEvent(new Event("pointerlockchange"));
      });
      expect(result.current.element$.get()).toBe(mockElement);

      // Unlock
      act(() => {
        (document as any).pointerLockElement = null;
        document.dispatchEvent(new Event("pointerlockchange"));
      });

      expect(result.current.element$.get()).toBeNull();
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => usePointerLock());
      unmount();
      await flush();

      expect(addSpy.mock.calls.some(([t]) => t === "pointerlockchange")).toBe(true);
      expect(removeSpy.mock.calls.some(([t]) => t === "pointerlockchange")).toBe(true);
      expect(addSpy.mock.calls.some(([t]) => t === "pointerlockerror")).toBe(true);
      expect(removeSpy.mock.calls.some(([t]) => t === "pointerlockerror")).toBe(true);
    });
  });

  describe("pointerlockerror", () => {
    it("resets element$ to null on pointerlockerror", () => {
      const { result } = renderHook(() => usePointerLock());

      // Simulate a lock that was granted
      act(() => {
        (document as any).pointerLockElement = mockElement;
        document.dispatchEvent(new Event("pointerlockchange"));
      });
      expect(result.current.element$.get()).toBe(mockElement);

      // Simulate lock error
      act(() => {
        document.dispatchEvent(new Event("pointerlockerror"));
      });

      expect(result.current.element$.get()).toBeNull();
    });
  });

  describe("unmount auto-unlock", () => {
    it("calls exitPointerLock on unmount when pointer is locked", async () => {
      const { result, unmount } = renderHook(() => usePointerLock());

      // Simulate lock
      act(() => {
        (document as any).pointerLockElement = mockElement;
        document.dispatchEvent(new Event("pointerlockchange"));
      });
      expect(result.current.element$.get()).toBe(mockElement);

      unmount();
      await flush();

      expect(document.exitPointerLock).toHaveBeenCalled();
    });

    it("does not call exitPointerLock on unmount when not locked", () => {
      const { unmount } = renderHook(() => usePointerLock());

      unmount();

      expect(document.exitPointerLock).not.toHaveBeenCalled();
    });
  });
});
