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

// ---------------------------------------------------------------------------
// rAF mock helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let rafId: number;

beforeEach(() => {
  animationInstances = [];
  // @ts-expect-error — patching prototype with mock
  Element.prototype.animate = vi.fn(() => new MockAnimation());

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
// useAnimate — Edge Case Tests
// ---------------------------------------------------------------------------

const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

describe("useAnimate() \u2014 edge cases", () => {
  it("isSupported$ is false when Web Animations API is unavailable", () => {
    // @ts-expect-error — intentionally removing animate
    delete Element.prototype.animate;

    const el = document.createElement("div");
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, { duration: 1000 }));

    expect(result.current.isSupported$.peek()).toBe(false);
  });

  it("post-unmount play() call does not throw", () => {
    const el = document.createElement("div");
    const { result, unmount } = renderHook(() => useAnimate(wrapEl(el), kf, { duration: 1000 }));

    act(() => {
      unmount();
    });

    expect(() => {
      result.current.play();
    }).not.toThrow();
  });
});
