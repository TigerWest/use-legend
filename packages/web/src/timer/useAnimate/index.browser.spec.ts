/**
 * useAnimate - Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests the Web Animations API wrapper with real browser animation support.
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

// Simple keyframes used across most tests — long duration so animation
// doesn't finish before assertions run.
const kf: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const opts = { duration: 10000, fill: "forwards" as FillMode };

// ---------------------------------------------------------------------------
// useAnimate browser tests
// ---------------------------------------------------------------------------

describe("useAnimate() — real browser", () => {
  it("isSupported$ is true in real browser", () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));
    expect(result.current.isSupported$.get()).toBe(true);
  });

  it("auto-plays on mount when immediate defaults to true", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });
  });

  it("starts paused when immediate: false", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, { ...opts, immediate: false }));

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });
  });

  it("play() resumes a paused animation", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, { ...opts, immediate: false }));

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    act(() => {
      result.current.play();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });
  });

  it("pause() pauses a running animation", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });

    act(() => {
      result.current.pause();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });
  });

  it("reverse() reverses a running animation", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, { ...opts, immediate: false }));

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    // Advance to midpoint so reverse has somewhere to go
    act(() => {
      result.current.currentTime$.set(5000);
      result.current.play();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });

    const timeBeforeReverse = result.current.currentTime$.get();

    act(() => {
      result.current.reverse();
    });

    // Wait a few frames for currentTime to decrease
    await act(async () => {
      await new Promise<void>((r) => setTimeout(r, 100));
    });

    // After reverse, animation should still be running
    // and currentTime should be heading toward 0 (less than before)
    await waitFor(
      () => {
        const now = result.current.currentTime$.get();
        expect(now).not.toBeNull();
        expect(Number(now)).toBeLessThan(Number(timeBeforeReverse));
      },
      { timeout: 2000 }
    );

    expect(result.current.playState$.get()).toBe("running");
  });

  it("finish() sets playState to finished", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });

    act(() => {
      result.current.finish();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("finished"), {
      timeout: 2000,
    });
  });

  it("cancel() sets playState to idle", async () => {
    const { result } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

    await waitFor(() => expect(result.current.playState$.get()).toBe("running"), { timeout: 2000 });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("idle"), { timeout: 2000 });
  });

  it("commitStyles: true commits computed styles to element after finish", async () => {
    const { result } = renderHook(() =>
      useAnimate(wrapEl(el), kf, {
        duration: 1000,
        fill: "forwards" as FillMode,
        commitStyles: true,
      })
    );

    await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

    act(() => {
      result.current.finish();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("finished"), {
      timeout: 2000,
    });

    expect(el.style.opacity).toBe("1");
  });

  it("commitStyles: false does not commit computed styles after finish", async () => {
    const { result } = renderHook(() =>
      useAnimate(wrapEl(el), kf, {
        duration: 1000,
        fill: "forwards" as FillMode,
        commitStyles: false,
      })
    );

    await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

    act(() => {
      result.current.finish();
    });

    await waitFor(() => expect(result.current.playState$.get()).toBe("finished"), {
      timeout: 2000,
    });

    expect(el.style.opacity).toBe("");
  });

  it("onReady callback is called with the Animation instance", async () => {
    const onReady = vi.fn();

    renderHook(() => useAnimate(wrapEl(el), kf, { ...opts, onReady }));

    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1), { timeout: 2000 });

    const [animation] = onReady.mock.calls[0];
    expect(animation).toBeInstanceOf(Animation);
  });

  it("calls onError when play() throws", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAnimate(wrapEl(el), kf, { ...opts, immediate: false, onError })
    );

    await waitFor(() => expect(result.current.playState$.get()).toBe("paused"), { timeout: 2000 });

    const error = new Error("play failed");
    const playSpy = vi.spyOn(Animation.prototype, "play").mockImplementation(() => {
      throw error;
    });

    try {
      act(() => {
        result.current.play();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    } finally {
      playSpy.mockRestore();
    }
  });

  it("cancels animation on unmount", async () => {
    const { result, unmount } = renderHook(() => useAnimate(wrapEl(el), kf, opts));

    await waitFor(() => expect(result.current.animate$.get()).not.toBeNull(), { timeout: 2000 });

    const animation = result.current.animate$.get()!;

    act(() => {
      unmount();
    });

    await waitFor(() => expect(animation.playState).toBe("idle"), { timeout: 2000 });
  });
});
