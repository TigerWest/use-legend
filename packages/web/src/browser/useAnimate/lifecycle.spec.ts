// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
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
// useAnimate — Element Lifecycle Tests
// ---------------------------------------------------------------------------

const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const opts = { duration: 10000 };

describe("useAnimate() \u2014 element lifecycle", () => {
  describe("Ref$ target", () => {
    it("Ref$ null \u2192 element: animation is created and started", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      // No animation before element assignment
      expect(mockAnimate).not.toHaveBeenCalled();
      expect(result.current.anim.animate$.peek()).toBeNull();

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      // Animation created after element assignment
      expect(mockAnimate).toHaveBeenCalledTimes(1);
      expect(result.current.anim.animate$.peek()).not.toBeNull();
    });

    it("Ref$ element \u2192 null: animation.cancel() is called", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      const instance = animationInstances[0];
      instance.cancel.mockClear();

      act(() => {
        result.current.el$(null);
      });

      expect(instance.cancel).toHaveBeenCalled();
    });

    it("Ref$ element \u2192 null: animate$ becomes null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      expect(result.current.anim.animate$.peek()).not.toBeNull();

      act(() => {
        result.current.el$(null);
      });

      expect(result.current.anim.animate$.peek()).toBeNull();
    });
  });

  describe("Observable target", () => {
    it("Observable target null \u2192 element: animation is created", () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);

      const { result } = renderHook(() => useAnimate(target$, kf, opts));

      expect(mockAnimate).not.toHaveBeenCalled();
      expect(result.current.animate$.peek()).toBeNull();

      const div = document.createElement("div");
      act(() => {
        target$.set(ObservableHint.opaque(div));
      });

      expect(mockAnimate).toHaveBeenCalledTimes(1);
      expect(result.current.animate$.peek()).not.toBeNull();
    });

    it("Observable target element \u2192 null: animation.cancel() is called", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));

      renderHook(() => useAnimate(target$, kf, opts));

      const instance = animationInstances[0];
      instance.cancel.mockClear();

      act(() => {
        target$.set(null);
      });

      expect(instance.cancel).toHaveBeenCalled();
    });
  });

  describe("full cycle (null \u2192 element \u2192 null \u2192 element)", () => {
    it("full lifecycle: new animation is created on remount (not reused)", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      const div1 = document.createElement("div");
      const div2 = document.createElement("div");

      // null -> element (first mount)
      act(() => {
        result.current.el$(div1);
      });
      expect(mockAnimate).toHaveBeenCalledTimes(1);

      // element -> null (unmount)
      act(() => {
        result.current.el$(null);
      });

      mockAnimate.mockClear();

      // null -> element (remount)
      act(() => {
        result.current.el$(div2);
      });

      // New animation created, not reused
      expect(mockAnimate).toHaveBeenCalledTimes(1);
      expect(animationInstances.length).toBe(2);
    });

    it("running animation is cancelled when element is removed mid-animation", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      const instance = animationInstances[0];
      instance.playState = "running";
      instance.cancel.mockClear();

      // Remove while running
      act(() => {
        result.current.el$(null);
      });

      expect(instance.cancel).toHaveBeenCalled();
    });

    it("event listeners on Animation object are cleaned up when target is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const anim = useAnimate(el$, kf, opts);
        return { el$, anim };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      const instance = animationInstances[0];

      // Remove element — event listeners should be cleaned up
      act(() => {
        result.current.el$(null);
      });

      // animate$ becomes null, so useEventListener on animate$ should clean up
      expect(result.current.anim.animate$.peek()).toBeNull();
      // The animation was cancelled
      expect(instance.cancel).toHaveBeenCalled();
    });
  });
});
