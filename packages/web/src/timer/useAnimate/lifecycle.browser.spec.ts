/**
 * useAnimate - Element Lifecycle (Real Browser)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element mount/unmount lifecycle with real Web Animations API.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAnimate } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// useAnimate — Element Lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useAnimate() \u2014 element lifecycle (real browser)", () => {
  describe("target mount timing", () => {
    it("does not auto-play when target appears later and immediate is false", async () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);
      const { result } = renderHook(() => useAnimate(target$, kf, { ...opts, immediate: false }));

      expect(result.current.animate$.get()).toBeNull();

      act(() => {
        target$.set(ObservableHint.opaque(el));
      });

      await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

      await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });
    });
  });

  describe("full cycle", () => {
    it("cancels when target is removed and recreates when remounted", async () => {
      const el2 = document.createElement("div");
      Object.assign(el2.style, { width: "100px", height: "100px" });
      document.body.appendChild(el2);

      try {
        const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));
        const { result } = renderHook(() => useAnimate(target$, kf, opts));

        await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), {
          timeout: 2000,
        });

        const firstAnimation = result.current.animate$.get()!;

        act(() => {
          target$.set(null);
        });

        await waitFor(() => expect(result.current.animate$.get()).toBeNull(), { timeout: 2000 });

        expect(firstAnimation.playState).toBe("idle");

        act(() => {
          target$.set(ObservableHint.opaque(el2));
        });

        await waitFor(
          () => {
            const next = result.current.animate$.get();
            expect(next).not.toBeNull();
            expect(next).not.toBe(firstAnimation);
          },
          { timeout: 2000 }
        );
      } finally {
        if (el2.parentNode) document.body.removeChild(el2);
      }
    });
  });
});
