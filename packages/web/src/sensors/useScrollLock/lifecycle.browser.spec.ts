/**
 * useScrollLock — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real DOM and no mocking.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useScrollLock } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { overflow: "auto", width: "200px", height: "200px" });
  document.body.appendChild(el);
});

afterEach(() => {
  // Restore overflow in case a test locked without unlocking
  el.style.overflow = "auto";
  if (el.parentNode) document.body.removeChild(el);
});

// ---------------------------------------------------------------------------
// useScrollLock — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useScrollLock() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: applies overflow:hidden if isLocked$=true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      // Lock first while element is null
      act(() => result.current.lock());
      expect(result.current.isLocked$.get()).toBe(true);

      // Mount element — lock should apply immediately
      act(() => result.current.el$(el));

      expect(el.style.overflow).toBe("hidden");
    });

    it("Ref$ element → null: restores overflow on element removal", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      // Mount element and lock
      act(() => result.current.el$(el));
      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      // Remove element — overflow should be restored
      act(() => result.current.el$(null));

      expect(el.style.overflow).toBe("auto");
    });

    it("Ref$ element → null → element: overflow:hidden re-applied after re-mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      // Mount, lock, unmount
      act(() => result.current.el$(el));
      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      act(() => result.current.el$(null));
      expect(el.style.overflow).toBe("auto");

      // Re-mount — lock should re-apply because isLocked$ is still true
      act(() => result.current.el$(el));
      expect(el.style.overflow).toBe("hidden");
    });

    it("addEventListener/removeEventListener counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      const addCount = addSpy.mock.calls.length;
      const removeCount = removeSpy.mock.calls.length;

      expect(addCount).toBeGreaterThan(0);
      expect(addCount).toBe(removeCount);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable target null → element: applies lock if active", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useScrollLock(target$ as any));

      // Lock while element is null
      act(() => result.current.lock());
      expect(result.current.isLocked$.get()).toBe(true);

      // Set element — lock should apply
      act(() => target$.set(ObservableHint.opaque(el)));

      expect(el.style.overflow).toBe("hidden");
    });

    it("Observable target element → null: restores overflow", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useScrollLock(target$ as any));

      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      // Remove element
      act(() => target$.set(null));

      expect(el.style.overflow).toBe("auto");
    });

    it("Observable target element → null → element: lock re-applied after re-set", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useScrollLock(target$ as any));

      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      // Remove
      act(() => target$.set(null));
      expect(el.style.overflow).toBe("auto");

      // Re-add — lock should re-apply
      act(() => target$.set(ObservableHint.opaque(el)));
      expect(el.style.overflow).toBe("hidden");
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // 3 full cycles
      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(el));
        act(() => result.current.el$(null));
      }

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("overflow value is correctly restored at each removal", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.lock());

      // Cycle 1
      act(() => result.current.el$(el));
      expect(el.style.overflow).toBe("hidden");
      act(() => result.current.el$(null));
      expect(el.style.overflow).toBe("auto");

      // Cycle 2
      act(() => result.current.el$(el));
      expect(el.style.overflow).toBe("hidden");
      act(() => result.current.el$(null));
      expect(el.style.overflow).toBe("auto");
    });

    it("lock/unlock still functional after multiple mount cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      // Two mount/unmount cycles
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // Re-mount and verify lock/unlock still works
      act(() => result.current.el$(el));

      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");
      expect(result.current.isLocked$.get()).toBe(true);

      act(() => result.current.unlock());
      expect(el.style.overflow).toBe("auto");
      expect(result.current.isLocked$.get()).toBe(false);

      act(() => result.current.toggle());
      expect(el.style.overflow).toBe("hidden");
      expect(result.current.isLocked$.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("restores overflow on component unmount while locked", async () => {
      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      // Unmount component — overflow should be restored
      act(() => unmount());

      expect(el.style.overflow).toBe("auto");
    });

    it("overflow is restored even when touchmove was active", async () => {
      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());

      // Verify touchmove is prevented while locked
      const touchBefore = new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchBefore);
      expect(touchBefore.defaultPrevented).toBe(true);

      // Unmount — overflow must be restored
      act(() => unmount());
      expect(el.style.overflow).toBe("auto");
    });
  });
});
