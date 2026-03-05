/**
 * useAnimate - Reactive Options (Real Browser)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests Observable keyframes and bidirectional sync with real Web Animations API.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

const opts = { duration: 10000, fill: "forwards" as FillMode };

// ---------------------------------------------------------------------------
// useAnimate — Reactive Options (real browser)
// ---------------------------------------------------------------------------

describe("useAnimate() \u2014 reactive options (real browser)", () => {
  describe("Observable keyframes change", () => {
    it("reactive keyframes \u2014 changing keyframes observable updates the effect", async () => {
      const keyframes$ = observable<Keyframe[]>([{ opacity: 0 }, { opacity: 1 }]);

      const { result } = renderHook(() => useAnimate(wrapEl(el), keyframes$, opts));

      await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

      act(() => {
        keyframes$.set([{ transform: "translateX(0px)" }, { transform: "translateX(100px)" }]);
      });

      // Wait for rAF sync to propagate effect change
      await act(async () => {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      });

      // Animation instance should still exist with the updated effect
      expect(result.current.animate$.get()).not.toBeNull();
    });

    it("reactive keyframes \u2014 null keyframes clears effect keyframes", async () => {
      const keyframes$ = observable<Keyframe[] | null>([{ opacity: 0 }, { opacity: 1 }]);
      const { result } = renderHook(() => useAnimate(wrapEl(el), keyframes$, opts));

      await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

      act(() => {
        keyframes$.set(null);
      });

      await act(async () => {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      });

      const animation = result.current.animate$.get();
      const effect = animation?.effect as unknown as KeyframeEffect;
      expect(effect.getKeyframes()).toHaveLength(0);
    });
  });

  describe("bidirectional sync", () => {
    it("currentTime$ setter updates animation currentTime", async () => {
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
      const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

      await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

      act(() => {
        result.current.pause();
      });

      await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

      act(() => {
        result.current.currentTime$.set(50);
      });

      await act(async () => {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      });

      const animation = result.current.animate$.get();
      expect(Number(animation?.currentTime)).toBeCloseTo(50, -1);
    });

    it("playbackRate$ setter updates animation playbackRate", async () => {
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
      const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

      await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

      act(() => {
        result.current.playbackRate$.set(2);
      });

      await act(async () => {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      });

      await waitFor(() => expect(result.current.playbackRate$.get()).toBe(2), { timeout: 2000 });

      const animation = result.current.animate$.get();
      expect(animation?.playbackRate).toBe(2);
    });
  });
});
