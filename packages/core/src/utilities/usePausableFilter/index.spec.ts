// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFilterWrapper, debounceFilter, bypassFilter } from "@shared/filters";
import { createPausableFilter, usePausableFilter } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createPausableFilter()", () => {
  it("returns isActive$, pause, resume, and eventFilter", () => {
    const { isActive$, pause, resume, eventFilter } = createPausableFilter();
    expect(isActive$.get()).toBe(true);
    expect(typeof pause).toBe("function");
    expect(typeof resume).toBe("function");
    expect(typeof eventFilter).toBe("function");
  });

  it("calls through when active", async () => {
    const { eventFilter } = createPausableFilter();
    const fn = vi.fn().mockReturnValue("ok");
    const wrapped = createFilterWrapper(eventFilter, fn);

    await wrapped();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("drops invocations when paused", async () => {
    const { pause, eventFilter } = createPausableFilter();
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    pause();
    await wrapped();
    expect(fn).not.toHaveBeenCalled();
  });

  it("resumes invocations after resume()", async () => {
    const { pause, resume, eventFilter } = createPausableFilter();
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    pause();
    await wrapped();
    expect(fn).not.toHaveBeenCalled();

    resume();
    await wrapped();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("isActive$ reflects pause/resume state", () => {
    const { isActive$, pause, resume } = createPausableFilter();

    expect(isActive$.get()).toBe(true);
    pause();
    expect(isActive$.get()).toBe(false);
    resume();
    expect(isActive$.get()).toBe(true);
  });

  it("composes with an inner filter (e.g. debounceFilter)", async () => {
    const { pause, resume, eventFilter } = createPausableFilter(debounceFilter(100));
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    wrapped();
    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledOnce();

    pause();
    wrapped();
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(1);

    resume();
  });

  it("pause() is idempotent", async () => {
    const { isActive$, pause, eventFilter } = createPausableFilter();
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    pause();
    pause();
    pause();

    expect(isActive$.get()).toBe(false);
    await wrapped();
    expect(fn).not.toHaveBeenCalled();
  });

  it("resume() is idempotent", async () => {
    const { isActive$, pause, resume, eventFilter } = createPausableFilter();
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    pause();
    resume();
    resume();
    resume();

    expect(isActive$.get()).toBe(true);
    await wrapped();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("initialState: 'paused' — starts paused until resumed", async () => {
    const { isActive$, resume, eventFilter } = createPausableFilter(bypassFilter, {
      initialState: "paused",
    });
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    expect(isActive$.get()).toBe(false);
    await wrapped();
    expect(fn).not.toHaveBeenCalled();

    resume();
    await wrapped();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("pause during in-flight debounce — debounce fires after timeout regardless", async () => {
    const { pause, eventFilter } = createPausableFilter(debounceFilter(100));
    const fn = vi.fn();
    const wrapped = createFilterWrapper(eventFilter, fn);

    wrapped();
    expect(fn).not.toHaveBeenCalled();

    pause();

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("usePausableFilter()", () => {
  it("returns isActive$, pause, resume, and eventFilter", () => {
    const { result } = renderHook(() => usePausableFilter());
    const { isActive$, pause, resume, eventFilter } = result.current;

    expect(isActive$.get()).toBe(true);
    expect(typeof pause).toBe("function");
    expect(typeof resume).toBe("function");
    expect(typeof eventFilter).toBe("function");
  });

  it("pause() and resume() update isActive$", () => {
    const { result } = renderHook(() => usePausableFilter());

    act(() => {
      result.current.pause();
    });
    expect(result.current.isActive$.get()).toBe(false);

    act(() => {
      result.current.resume();
    });
    expect(result.current.isActive$.get()).toBe(true);
  });

  it("initialState: 'paused' — starts paused", () => {
    const { result } = renderHook(() => usePausableFilter(undefined, { initialState: "paused" }));

    expect(result.current.isActive$.get()).toBe(false);
  });

  it("returns a stable instance across re-renders", () => {
    const { result, rerender } = renderHook(() => usePausableFilter());

    const first = result.current;
    rerender();
    const second = result.current;

    expect(first.eventFilter).toBe(second.eventFilter);
    expect(first.pause).toBe(second.pause);
    expect(first.resume).toBe(second.resume);
  });

  it("state persists across re-renders", () => {
    const { result, rerender } = renderHook(() => usePausableFilter());

    act(() => {
      result.current.pause();
    });

    rerender();

    expect(result.current.isActive$.get()).toBe(false);
  });
});
