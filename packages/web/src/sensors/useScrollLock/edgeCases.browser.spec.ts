/**
 * useScrollLock - Edge Cases Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Edge cases that verify overflow save/restore logic and idempotency guards.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useScrollLock } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
  // Reset any inline styles that may have leaked onto body
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

// ---------------------------------------------------------------------------
// useScrollLock — edge cases (real browser)
// ---------------------------------------------------------------------------

describe("useScrollLock() — edge cases (real browser)", () => {
  it("multiple lock() calls do not stack overflow saves", () => {
    el.style.overflow = "scroll";

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    // First lock — saves "scroll", applies "hidden"
    act(() => {
      result.current.lock();
    });
    expect(el.style.overflow).toBe("hidden");

    // Second lock — isApplied guard should prevent re-saving "hidden"
    act(() => {
      result.current.lock();
    });
    expect(el.style.overflow).toBe("hidden");

    // Single unlock — must restore the original "scroll", not "hidden"
    act(() => {
      result.current.unlock();
    });
    expect(el.style.overflow).toBe("scroll");
  });

  it("unlock() when not locked is a no-op", () => {
    el.style.overflow = "auto";

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    // unlock without a prior lock — overflow must remain untouched
    act(() => {
      result.current.unlock();
    });
    expect(el.style.overflow).toBe("auto");
    expect(result.current.isLocked$.get()).toBe(false);
  });

  it("toggle() is idempotent when called rapidly", () => {
    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    // Four rapid toggles: false→true→false→true→false
    act(() => {
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
    });

    // Even number of toggles → should end up unlocked
    expect(result.current.isLocked$.get()).toBe(false);
    expect(el.style.overflow).not.toBe("hidden");

    // Five rapid toggles: ends locked
    act(() => {
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
      result.current.toggle();
    });

    expect(result.current.isLocked$.get()).toBe(true);
    expect(el.style.overflow).toBe("hidden");
  });

  it("handles element with inline overflow style", () => {
    el.style.overflow = "scroll";

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    act(() => {
      result.current.lock();
    });
    expect(el.style.overflow).toBe("hidden");

    act(() => {
      result.current.unlock();
    });
    // Original inline value must be restored exactly
    expect(el.style.overflow).toBe("scroll");
  });

  it("handles element with no initial overflow style", () => {
    // No inline overflow set — style.overflow is ""
    expect(el.style.overflow).toBe("");

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    act(() => {
      result.current.lock();
    });
    expect(el.style.overflow).toBe("hidden");

    act(() => {
      result.current.unlock();
    });
    // Must restore to empty string, not some default keyword
    expect(el.style.overflow).toBe("");
  });
});
