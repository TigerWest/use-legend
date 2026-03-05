// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAnimate } from ".";

// ---------------------------------------------------------------------------
// Animation mock
// ---------------------------------------------------------------------------

const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockReverse = vi.fn();
const mockFinish = vi.fn();
const mockCancel = vi.fn();
const mockPersist = vi.fn();
const mockCommitStyles = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

let animationInstances: MockAnimation[] = [];

class MockAnimation {
  playState: AnimationPlayState = "idle";
  pending = false;
  replaceState: AnimationReplaceState = "active";
  currentTime: number | null = null;
  startTime: number | null = null;
  playbackRate = 1;
  timeline: AnimationTimeline | null = null;
  effect: KeyframeEffect | null = null;

  play = mockPlay.mockImplementation(() => {
    this.playState = "running";
  });
  pause = mockPause.mockImplementation(() => {
    this.playState = "paused";
  });
  reverse = mockReverse;
  finish = mockFinish.mockImplementation(() => {
    this.playState = "finished";
  });
  cancel = mockCancel.mockImplementation(() => {
    this.playState = "idle";
  });
  persist = mockPersist;
  commitStyles = mockCommitStyles;
  addEventListener = mockAddEventListener;
  removeEventListener = mockRemoveEventListener;

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
  mockPlay.mockClear();
  mockPause.mockClear();
  mockReverse.mockClear();
  mockFinish.mockClear();
  mockCancel.mockClear();
  mockPersist.mockClear();
  mockCommitStyles.mockClear();
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();

  mockAnimate = vi.fn(() => new MockAnimation());
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
// useAnimate — Core Functionality Tests
// ---------------------------------------------------------------------------

describe("useAnimate()", () => {
  describe("isSupported$", () => {
    it("isSupported$ is false when element.animate is not available", () => {
      // @ts-expect-error — intentionally removing animate
      delete Element.prototype.animate;

      const el = document.createElement("div");
      const { result } = renderHook(() => useAnimate(wrapEl(el), [], { duration: 1000 }));

      expect(result.current.isSupported$.peek()).toBe(false);
    });
  });

  describe("return structure", () => {
    it("returns animate$, playState$, currentTime$, playbackRate$ observables", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useAnimate(wrapEl(el), [], { duration: 1000 }));

      expect(result.current.animate$).toBeDefined();
      expect(result.current.playState$).toBeDefined();
      expect(result.current.currentTime$).toBeDefined();
      expect(result.current.playbackRate$).toBeDefined();
      expect(result.current.isSupported$).toBeDefined();
      expect(result.current.pending$).toBeDefined();
      expect(result.current.replaceState$).toBeDefined();
      expect(result.current.startTime$).toBeDefined();
      expect(result.current.timeline$).toBeDefined();

      // Action methods
      expect(typeof result.current.play).toBe("function");
      expect(typeof result.current.pause).toBe("function");
      expect(typeof result.current.reverse).toBe("function");
      expect(typeof result.current.finish).toBe("function");
      expect(typeof result.current.cancel).toBe("function");
    });
  });

  describe("initial values", () => {
    it("animate$ is null before target is mounted", () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);
      const { result } = renderHook(() => useAnimate(target$, [], { duration: 1000 }));

      expect(result.current.animate$.peek()).toBeNull();
    });

    it("playState$ initial value is 'idle'", () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);
      const { result } = renderHook(() =>
        useAnimate(target$, [], { duration: 1000, immediate: false })
      );

      expect(result.current.playState$.peek()).toBe("idle");
    });
  });

  describe("controls \u2014 null target", () => {
    it("action methods (play/pause/reverse/finish/cancel) are no-ops when animate$ is null", () => {
      const target$ = observable<OpaqueObject<Element> | null>(null);
      const { result } = renderHook(() =>
        useAnimate(target$, [], { duration: 1000, immediate: false })
      );

      expect(result.current.animate$.peek()).toBeNull();

      expect(() => {
        act(() => {
          result.current.play();
          result.current.pause();
          result.current.reverse();
          result.current.finish();
          result.current.cancel();
        });
      }).not.toThrow();
    });
  });

  describe("unmount cleanup", () => {
    it("unmount calls animation.cancel()", async () => {
      const el = document.createElement("div");
      const { unmount } = renderHook(() =>
        useAnimate(wrapEl(el), [{ opacity: 0 }, { opacity: 1 }], { duration: 1000 })
      );

      expect(animationInstances.length).toBe(1);
      const instance = animationInstances[0];

      await act(async () => {
        unmount();
      });

      // cancel() is called either by useUnmount or by the element observer cleanup
      expect(instance.cancel).toHaveBeenCalled();
    });
  });
});
