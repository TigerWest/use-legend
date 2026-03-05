/**
 * useAnimate - Edge Cases (Real Browser)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests boundary conditions and special scenarios with real Web Animations API.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAnimate } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { width: "100px", height: "100px" });
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
});

const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const opts = { duration: 10000, fill: "forwards" as FillMode };

// ---------------------------------------------------------------------------
// useAnimate — Edge Cases (real browser)
// ---------------------------------------------------------------------------

describe("useAnimate() \u2014 edge cases (real browser)", () => {
  it("action methods are safe before target is mounted", () => {
    const target$ = observable<OpaqueObject<Element> | null>(null);
    const { result } = renderHook(() => useAnimate(target$, kf, { ...opts, immediate: false }));

    expect(() => {
      act(() => {
        result.current.play();
        result.current.pause();
        result.current.reverse();
        result.current.finish();
        result.current.cancel();
      });
    }).not.toThrow();

    expect(result.current.animate$.get()).toBeNull();
  });

  it("remains stable under rapid reverse/play/pause toggling", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAnimate(wrapEl(el), kf, { ...opts, immediate: false, onError })
    );

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    act(() => {
      for (let i = 0; i < 300; i++) {
        result.current.reverse();
        result.current.play();
        result.current.pause();
      }
    });

    await act(async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    });

    expect(result.current.animate$.get()).not.toBeNull();
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it("remains stable under rapid reverse-only toggling", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAnimate(wrapEl(el), kf, { ...opts, immediate: false, onError })
    );

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    act(() => {
      for (let i = 0; i < 500; i++) {
        result.current.reverse();
      }
    });

    await act(async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    });

    expect(result.current.animate$.get()).not.toBeNull();
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it("coalesces reverse() bursts in the same frame", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, { ...opts, immediate: false }));

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    const reverseSpy = vi.spyOn(Animation.prototype, "reverse");
    try {
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.reverse();
        }
      });

      expect(reverseSpy.mock.calls.length).toBeLessThanOrEqual(1);
    } finally {
      reverseSpy.mockRestore();
    }
  });

  it("accepts a number as the duration shorthand", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, 10000));

    await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });
  });
});
