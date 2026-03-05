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

// Mock KeyframeEffect constructor used in keyframes reactivity
const mockKeyframeEffect = vi.fn();

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

  // Mock KeyframeEffect so we can track effect replacements
  (global as unknown as Record<string, unknown>).KeyframeEffect =
    mockKeyframeEffect.mockImplementation(function (_el: Element, kf: Keyframe[] | null) {
      const keyframes = kf ?? [];
      return {
        getKeyframes: () => keyframes,
      };
    });

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
// useAnimate — Reactive Options Tests
// ---------------------------------------------------------------------------

const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const opts = { duration: 10000 };

describe("useAnimate() \u2014 reactive options", () => {
  describe("Observable option change", () => {
    it("Observable keyframes change \u2192 animation effect is updated", () => {
      const el = document.createElement("div");
      const keyframes$ = observable<Keyframe[]>([{ opacity: 0 }, { opacity: 1 }]);

      renderHook(() => useAnimate(wrapEl(el), keyframes$, opts));

      expect(animationInstances.length).toBe(1);
      const instance = animationInstances[0];

      mockKeyframeEffect.mockClear();

      // Change the keyframes observable
      act(() => {
        keyframes$.set([{ transform: "translateX(0px)" }, { transform: "translateX(100px)" }]);
      });

      // A new KeyframeEffect should have been created with the new keyframes
      expect(mockKeyframeEffect).toHaveBeenCalled();
      // The effect should be set on the animation instance
      expect(instance.effect).toBeDefined();
    });

    it("null keyframes \u2192 effect keyframes cleared", () => {
      const el = document.createElement("div");
      const keyframes$ = observable<Keyframe[] | null>([{ opacity: 0 }, { opacity: 1 }]);

      renderHook(() => useAnimate(wrapEl(el), keyframes$, opts));

      expect(animationInstances.length).toBe(1);

      mockKeyframeEffect.mockClear();

      // Set keyframes to null
      act(() => {
        keyframes$.set(null);
      });

      // KeyframeEffect should be called with null keyframes
      expect(mockKeyframeEffect).toHaveBeenCalledWith(el, null, expect.anything());
    });
  });

  describe("bidirectional sync", () => {
    it("currentTime$ setter syncs to animation.currentTime", () => {
      const el = document.createElement("div");

      const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

      const instance = animationInstances[0];

      act(() => {
        result.current.currentTime$.set(5000);
      });

      expect(instance.currentTime).toBe(5000);
    });

    it("playbackRate$ setter syncs to animation.playbackRate", () => {
      const el = document.createElement("div");

      const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

      const instance = animationInstances[0];

      act(() => {
        result.current.playbackRate$.set(2);
      });

      expect(instance.playbackRate).toBe(2);
    });
  });
});
