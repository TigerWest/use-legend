/**
 * useScrollLock — Rerender Stability Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests rerender stability with real DOM style mutation and no mocking.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useScrollLock } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { width: "200px", height: "200px", overflow: "" });
  document.body.appendChild(el);
});

afterEach(() => {
  // Restore body overflow in case any test locked it
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  if (el.parentNode) document.body.removeChild(el);
});

// ---------------------------------------------------------------------------
// useScrollLock — rerender stability (real browser)
// ---------------------------------------------------------------------------

describe("useScrollLock() — rerender stability (real browser)", () => {
  it("lock/unlock function identity is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    const lockBefore = result.current.lock;
    const unlockBefore = result.current.unlock;
    const toggleBefore = result.current.toggle;

    rerender();

    expect(result.current.lock).toBe(lockBefore);
    expect(result.current.unlock).toBe(unlockBefore);
    expect(result.current.toggle).toBe(toggleBefore);
  });

  it("isLocked$ remains accurate after re-render", () => {
    const { result, rerender } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked$.get()).toBe(true);

    rerender();

    expect(result.current.isLocked$.get()).toBe(true);

    act(() => {
      result.current.unlock();
    });

    rerender();

    expect(result.current.isLocked$.get()).toBe(false);
  });

  it("overflow:hidden persists through re-render while locked", () => {
    const { result, rerender } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    act(() => {
      result.current.lock();
    });

    expect(el.style.overflow).toBe("hidden");

    rerender();

    expect(el.style.overflow).toBe("hidden");
  });

  it("does not re-apply overflow on unrelated re-render", () => {
    const { result, rerender } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const lock = useScrollLock(el$);
      return { el$, ...lock };
    });

    act(() => result.current.el$(el));

    act(() => {
      result.current.lock();
    });

    expect(el.style.overflow).toBe("hidden");

    // Spy after locking so the initial set is not counted
    const setterSpy = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "overflow");
    const originalSet = descriptor?.set;

    Object.defineProperty(el.style, "overflow", {
      get: descriptor?.get,
      set(value: string) {
        setterSpy(value);
        originalSet?.call(this, value);
      },
      configurable: true,
    });

    rerender();

    // overflow setter must not be called on an unrelated re-render while already locked
    expect(setterSpy).not.toHaveBeenCalled();

    // Restore original descriptor
    if (descriptor) {
      Object.defineProperty(el.style, "overflow", descriptor);
    }
  });
});
