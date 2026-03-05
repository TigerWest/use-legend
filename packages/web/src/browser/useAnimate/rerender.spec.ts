// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAnimate } from ".";

// ---------------------------------------------------------------------------
// Animation mock
// ---------------------------------------------------------------------------

let animationInstances: MockAnimation[] = [];

class MockAnimation {
  playState: AnimationPlayState = "running";
  pending = false;
  replaceState: AnimationReplaceState = "active";
  currentTime: number | null = 0;
  startTime: number | null = 0;
  playbackRate = 1;
  timeline: AnimationTimeline | null = null;
  effect: KeyframeEffect | null = null;

  play = vi.fn(() => {
    this.playState = "running";
  });
  pause = vi.fn(() => {
    this.playState = "paused";
  });
  reverse = vi.fn();
  finish = vi.fn(() => {
    this.playState = "finished";
  });
  cancel = vi.fn(() => {
    this.playState = "idle";
  });
  persist = vi.fn();
  commitStyles = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();

  constructor() {
    animationInstances.push(this);
  }
}

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

let mockAnimate: ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// rAF mock helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let rafId: number;

beforeEach(() => {
  animationInstances = [];
  mockAnimate = vi.fn(() => new MockAnimation());
  // @ts-expect-error — patching prototype with mock
  Element.prototype.animate = mockAnimate;

  rafCallbacks = new Map();
  rafId = 0;

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafCallbacks.set(++rafId, cb);
    return rafId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    rafCallbacks.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // @ts-expect-error — clean up patched prototype
  delete Element.prototype.animate;
});

// ---------------------------------------------------------------------------
// useAnimate — Rerender Stability Tests
// ---------------------------------------------------------------------------

describe("useAnimate() \u2014 rerender stability", () => {
  describe("resource stability", () => {
    it("does not cancel or recreate animation when unrelated state causes re-render", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useAnimate(elObs$, kf, { duration: 10000 });
        },
        { initialProps: { count: 0 } }
      );

      expect(mockAnimate).toHaveBeenCalledTimes(1);
      const firstInstance = animationInstances[0];

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      // Animation should not be recreated
      expect(mockAnimate).toHaveBeenCalledTimes(1);
      // Cancel should not be called from re-renders
      expect(firstInstance.cancel).not.toHaveBeenCalled();
    });

    it("RAF sync loop is not restarted on re-render", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const rafCallsBefore = rafCallbacks.size;

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useAnimate(elObs$, kf, { duration: 10000 });
        },
        { initialProps: { count: 0 } }
      );

      const rafCallsAfterMount = rafCallbacks.size;

      rerender({ count: 1 });
      rerender({ count: 2 });

      const rafCallsAfterRerenders = rafCallbacks.size;

      // rAF pending count should not significantly increase from re-renders alone
      expect(rafCallsAfterRerenders - rafCallsAfterMount).toBeLessThanOrEqual(
        rafCallsAfterMount - rafCallsBefore + 1
      );
    });
  });

  describe("value accuracy", () => {
    it("playState$ remains correct after re-render", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useAnimate(elObs$, kf, { duration: 10000, immediate: false });
        },
        { initialProps: { count: 0 } }
      );

      expect(result.current.playState$.peek()).toBe("paused");

      rerender({ count: 1 });
      expect(result.current.playState$.peek()).toBe("paused");

      rerender({ count: 2 });
      expect(result.current.playState$.peek()).toBe("paused");
    });

    it("currentTime$/playbackRate$ bidirectional sync works after re-render", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useAnimate(elObs$, kf, { duration: 10000 });
        },
        { initialProps: { count: 0 } }
      );

      rerender({ count: 1 });

      // Setting currentTime$ should still sync to the animation
      act(() => {
        result.current.currentTime$.set(5000);
      });

      const anim = animationInstances[0];
      expect(anim.currentTime).toBe(5000);

      // Setting playbackRate$ should still sync
      act(() => {
        result.current.playbackRate$.set(2);
      });

      expect(anim.playbackRate).toBe(2);
    });
  });

  describe("stable return references", () => {
    it("animate$ reference is stable across re-renders", () => {
      const el = document.createElement("div");
      const elObs$ = wrapEl(el);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useAnimate(elObs$, kf, { duration: 10000 });
        },
        { initialProps: { count: 0 } }
      );

      const animate$Before = result.current.animate$;

      rerender({ count: 1 });

      expect(result.current.animate$).toBe(animate$Before);
    });
  });

  describe("callback freshness", () => {
    it("onReady/onError callbacks use latest closure after re-render", () => {
      const el = document.createElement("div");
      const target$ = observable<OpaqueObject<Element> | null>(null);
      const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

      const onReady1 = vi.fn();
      const onReady2 = vi.fn();

      const { rerender } = renderHook(
        (props: { onReady: (anim: Animation) => void }) =>
          useAnimate(target$, kf, { duration: 10000, onReady: props.onReady, immediate: false }),
        { initialProps: { onReady: onReady1 } }
      );

      // Re-render with new callback
      rerender({ onReady: onReady2 });

      // Mount the element after re-render
      act(() => {
        target$.set(ObservableHint.opaque(el));
      });

      // The animation should be created when the element is set
      const totalCalls = onReady1.mock.calls.length + onReady2.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(1);

      // Critical: the last call should be to the latest callback
      // (onReady2 must be called — stale onReady1 should not be the only one invoked)
      expect(onReady2).toHaveBeenCalled();
    });
  });
});
