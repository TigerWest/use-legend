// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// basic
// ---------------------------------------------------------------------------

describe("basic", () => {
  it("remaining$ starts at initialCount", () => {
    const { result } = renderHook(() => useCountdown(10));
    expect(result.current.remaining$.get()).toBe(10);
  });

  it("remaining$ decrements by 1 each interval", () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(4);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(3);
  });

  it("remaining$ clamps to 0 (never goes negative)", () => {
    const { result } = renderHook(() => useCountdown(1));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(0);
  });

  it("pauses automatically when reaching 0", () => {
    const { result } = renderHook(() => useCountdown(1));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(0);
    expect(result.current.isActive$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// callbacks
// ---------------------------------------------------------------------------

describe("callbacks", () => {
  it("onTick(remaining) is called on each tick", () => {
    const onTick = vi.fn();
    renderHook(() => useCountdown(3, { onTick }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onTick).toHaveBeenCalledWith(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onTick).toHaveBeenCalledWith(1);
  });

  it("onComplete() is called when countdown reaches 0", () => {
    const onComplete = vi.fn();
    renderHook(() => useCountdown(1, { onComplete }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("onComplete is called only once", () => {
    const onComplete = vi.fn();
    renderHook(() => useCountdown(1, { onComplete }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// controls: reset
// ---------------------------------------------------------------------------

describe("controls: reset", () => {
  it("reset() restores to initialCount", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(7);

    act(() => {
      result.current.reset();
    });
    expect(result.current.remaining$.get()).toBe(10);
  });

  it("reset(n) sets remaining to n", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.reset(5);
    });
    expect(result.current.remaining$.get()).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// controls: stop
// ---------------------------------------------------------------------------

describe("controls: stop", () => {
  it("stop() pauses and resets", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.stop();
    });
    expect(result.current.remaining$.get()).toBe(10);
    expect(result.current.isActive$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// controls: start
// ---------------------------------------------------------------------------

describe("controls: start", () => {
  it("start() resets and resumes", () => {
    const { result } = renderHook(() => useCountdown(10, { immediate: false }));

    act(() => {
      result.current.start();
    });
    expect(result.current.remaining$.get()).toBe(10);
    expect(result.current.isActive$.get()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(9);
  });

  it("start(n) resets to n and resumes", () => {
    const { result } = renderHook(() => useCountdown(10, { immediate: false }));

    act(() => {
      result.current.start(20);
    });
    expect(result.current.remaining$.get()).toBe(20);
    expect(result.current.isActive$.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// controls: pause / resume
// ---------------------------------------------------------------------------

describe("controls: pause / resume", () => {
  it("pause() stops countdown", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(10);
  });

  it("resume() restarts countdown from current remaining", () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(7);

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(6);
  });

  it("resume() is no-op when remaining is 0", () => {
    const { result } = renderHook(() => useCountdown(1));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(0);

    act(() => {
      result.current.resume();
    });
    expect(result.current.isActive$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// options
// ---------------------------------------------------------------------------

describe("options", () => {
  it("interval option controls tick rate", () => {
    const { result } = renderHook(() => useCountdown(10, { interval: 500 }));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.remaining$.get()).toBe(9);
  });

  it("immediate=false does not start on mount", () => {
    const { result } = renderHook(() => useCountdown(10, { immediate: false }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(10);
    expect(result.current.isActive$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("interval is cleared on unmount", () => {
    const { result, unmount } = renderHook(() => useCountdown(10));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining$.get()).toBe(9);

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // No assertion on remaining$ after unmount — just ensure no errors thrown
  });
});

// ---------------------------------------------------------------------------
// MaybeObservable initialCount
// ---------------------------------------------------------------------------

describe("MaybeObservable initialCount", () => {
  it("accepts Observable<number> as initialCount", () => {
    const count$ = observable(10);
    const { result } = renderHook(() => useCountdown(count$));
    expect(result.current.remaining$.get()).toBe(10);
  });

  it("reset() reads current Observable value", () => {
    const count$ = observable(10);
    const { result } = renderHook(() => useCountdown(count$));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remaining$.get()).toBe(7);

    // Change the Observable source
    count$.set(20);

    act(() => {
      result.current.reset();
    });
    expect(result.current.remaining$.get()).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("initialCount=0 does not auto-start", () => {
    const { result } = renderHook(() => useCountdown(0));
    expect(result.current.remaining$.get()).toBe(0);
    expect(result.current.isActive$.get()).toBe(false);
  });

  it("start() with initialCount=0 is no-op", () => {
    const { result } = renderHook(() => useCountdown(0));

    act(() => {
      result.current.start();
    });
    expect(result.current.isActive$.get()).toBe(false);
  });
});
