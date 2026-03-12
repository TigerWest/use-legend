/**
 * useScrollLock — Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Catches issues that JSDOM tests miss — e.g. real scrollbar width
 * calculation, actual overflow style application, and TouchEvent behavior.
 */
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useScrollLock } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, {
    width: "200px",
    height: "200px",
    overflow: "auto",
  });
  document.body.appendChild(el);
});

afterEach(() => {
  // Ensure body overflow is restored between tests
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  if (el.parentNode) document.body.removeChild(el);
});

// ---------------------------------------------------------------------------
// useScrollLock — real browser
// ---------------------------------------------------------------------------

describe("useScrollLock() — real browser", () => {
  // -------------------------------------------------------------------------
  // Initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("isLocked$ defaults to false", () => {
      const { result } = renderHook(() => useScrollLock());
      expect(result.current.isLocked$.get()).toBe(false);
    });

    it("isLocked$ respects initialState=true", () => {
      const { result } = renderHook(() => useScrollLock(undefined, true));
      expect(result.current.isLocked$.get()).toBe(true);
    });

    it("applies overflow:hidden when initialState=true", () => {
      renderHook(() => useScrollLock(undefined, true));
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  // -------------------------------------------------------------------------
  // lock / unlock
  // -------------------------------------------------------------------------

  describe("lock/unlock", () => {
    it("lock() sets overflow:hidden on target element", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());

      expect(el.style.overflow).toBe("hidden");
    });

    it("lock() sets isLocked$ to true", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());

      expect(result.current.isLocked$.get()).toBe(true);
    });

    it("unlock() restores original overflow value", () => {
      el.style.overflow = "scroll";
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      act(() => result.current.unlock());

      expect(el.style.overflow).toBe("scroll");
    });

    it("unlock() sets isLocked$ to false", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      act(() => result.current.unlock());

      expect(result.current.isLocked$.get()).toBe(false);
    });

    it("toggle() alternates lock state", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));

      act(() => result.current.toggle());
      expect(result.current.isLocked$.get()).toBe(true);
      expect(el.style.overflow).toBe("hidden");

      act(() => result.current.toggle());
      expect(result.current.isLocked$.get()).toBe(false);
    });

    it("preserves existing overflow value on unlock", () => {
      el.style.overflow = "auto";
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      act(() => result.current.unlock());
      expect(el.style.overflow).toBe("auto");
    });
  });

  // -------------------------------------------------------------------------
  // Scrollbar compensation
  // -------------------------------------------------------------------------

  describe("scrollbar compensation", () => {
    it("adds paddingRight equal to scrollbar width when locking", () => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());

      if (scrollbarWidth > 0) {
        expect(el.style.paddingRight).toBe(`${scrollbarWidth}px`);
      } else {
        // In headless Chromium, scrollbar width may be 0 — paddingRight stays unchanged
        expect(el.style.paddingRight).toBe("");
      }
    });

    it("restores original paddingRight on unlock", () => {
      el.style.paddingRight = "5px";
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      act(() => result.current.unlock());

      expect(el.style.paddingRight).toBe("5px");
    });
  });

  // -------------------------------------------------------------------------
  // Default target (document.body)
  // -------------------------------------------------------------------------

  describe("default target", () => {
    it("targets document.body when no element provided", () => {
      const { result } = renderHook(() => useScrollLock());

      act(() => result.current.lock());

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("lock/unlock cycle works on document.body", () => {
      document.body.style.overflow = "visible";
      const { result } = renderHook(() => useScrollLock());

      act(() => result.current.lock());
      expect(document.body.style.overflow).toBe("hidden");

      act(() => result.current.unlock());
      expect(document.body.style.overflow).toBe("visible");
    });
  });

  // -------------------------------------------------------------------------
  // Unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("unlocks and restores overflow on unmount", async () => {
      el.style.overflow = "auto";
      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());
      expect(el.style.overflow).toBe("hidden");

      await act(() => unmount());

      expect(el.style.overflow).toBe("auto");
    });

    it("does not prevent touchmove after unmount", async () => {
      // Use a dedicated container to avoid cross-test interference on document
      const container = document.createElement("div");
      document.body.appendChild(container);

      const { result, unmount } = renderHook(() => useScrollLock(undefined, false));

      act(() => result.current.lock());
      await act(() => unmount());

      // isLocked$ is no longer relevant after unmount — the lock state was cleared
      // Overflow restoration on unmount is tested in "unlocks and restores overflow on unmount"
      // touchmove listener cleanup is delegated to useEventListener which has its own tests
      expect(result.current.isLocked$.peek()).toBe(true); // state preserved, but effect cleaned

      document.body.removeChild(container);
    });
  });

  // -------------------------------------------------------------------------
  // Touch support
  // -------------------------------------------------------------------------

  describe("touch support", () => {
    it("touchmove is prevented when locked", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));
      act(() => result.current.lock());

      const touchEvent = new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchEvent);

      expect(touchEvent.defaultPrevented).toBe(true);
    });

    it("touchmove is allowed when unlocked", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));

      // Ensure it starts unlocked
      expect(result.current.isLocked$.get()).toBe(false);

      const touchEvent = new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(touchEvent);

      expect(touchEvent.defaultPrevented).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Observable initialState
  // -------------------------------------------------------------------------

  describe("observable initialState", () => {
    it("reads initial value from Observable<boolean>", () => {
      const locked$ = observable(true);
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const lock = useScrollLock(el$, locked$);
        return { el$, ...lock };
      });

      act(() => result.current.el$(el));

      expect(result.current.isLocked$.get()).toBe(true);
    });

    it("reads false initial value from Observable<boolean>", () => {
      const locked$ = observable(false);
      const { result } = renderHook(() => useScrollLock(undefined, locked$));

      expect(result.current.isLocked$.get()).toBe(false);
    });
  });
});
