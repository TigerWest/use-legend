import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { bypassFilter, createFilterWrapper, debounceFilter, throttleFilter } from "./filters";

describe("bypassFilter", () => {
  it("calls invoke immediately and returns its result", () => {
    const fn = vi.fn().mockReturnValue(42);
    const wrapped = createFilterWrapper(bypassFilter, fn);
    const result = wrapped();
    expect(fn).toHaveBeenCalledOnce();
    return expect(result).resolves.toBe(42);
  });
});

describe("createFilterWrapper", () => {
  it("passes args and thisArg to the original function", async () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const wrapped = createFilterWrapper(bypassFilter, fn);
    await expect(wrapped(1, 2)).resolves.toBe(3);
    expect(fn).toHaveBeenCalledWith(1, 2);
  });

  it("returns a Promise", () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(bypassFilter, fn);
    expect(wrapped()).toBeInstanceOf(Promise);
  });

  it("rejects if the filter rejects", async () => {
    const failFilter: typeof bypassFilter = () => Promise.reject(new Error("fail"));
    const fn = vi.fn();
    const wrapped = createFilterWrapper(failFilter, fn);
    await expect(wrapped()).rejects.toThrow("fail");
    expect(fn).not.toHaveBeenCalled();
  });

  it("async fn — nested Promise is unwrapped correctly", async () => {
    const fn = vi.fn().mockResolvedValue("async-result");
    const wrapped = createFilterWrapper(bypassFilter, fn);
    // createFilterWrapper wraps in Promise; fn returns Promise — should not double-wrap
    await expect(wrapped()).resolves.toBe("async-result");
  });
});

describe("debounceFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces multiple rapid calls — only last fires", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(debounceFilter(100), fn);

    wrapped();
    wrapped();
    const last = wrapped();

    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledOnce();
    await expect(last).resolves.toBeUndefined();
  });

  it("calls immediately when ms = 0", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(debounceFilter(0), fn);
    await wrapped();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("accepts Observable<number> for reactive ms", async () => {
    const ms$ = observable(100);
    const fn = vi.fn();
    const wrapped = createFilterWrapper(debounceFilter(ms$), fn);

    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1);

    // Update ms — next call uses new duration
    ms$.set(200);
    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1); // still 1 — needs 200ms

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("last-call-wins: only the final rapid call's fn result resolves", async () => {
    const fn = vi.fn().mockReturnValue("result");
    const wrapped = createFilterWrapper(debounceFilter(100), fn);

    wrapped(); // superseded — pending Promise, GC'd
    const last = wrapped(); // this one wins

    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledOnce();
    await expect(last).resolves.toBe("result");
  });

  it("all intermediate Promises resolve with the same final result (VueUse semantics)", async () => {
    const fn = vi.fn().mockReturnValue("final");
    const wrapped = createFilterWrapper(debounceFilter(100), fn);

    const p1 = wrapped(); // intermediate
    const p2 = wrapped(); // intermediate
    const p3 = wrapped(); // last call wins

    await vi.advanceTimersByTimeAsync(100);

    expect(fn).toHaveBeenCalledOnce();
    // All three resolve with the same value — none left hanging
    await expect(p1).resolves.toBe("final");
    await expect(p2).resolves.toBe("final");
    await expect(p3).resolves.toBe("final");
  });

  it("edges: ['leading'] — fires on first call, not after delay", async () => {
    const fn = vi.fn().mockReturnValue("lead");
    const wrapped = createFilterWrapper(debounceFilter(100, { edges: ["leading"] }), fn);

    const p = wrapped();
    // leading: fires immediately on first call
    expect(fn).toHaveBeenCalledOnce();
    await expect(p).resolves.toBe("lead");

    // subsequent rapid calls within window are suppressed
    wrapped();
    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    // trailing is disabled — fn still called only once
    expect(fn).toHaveBeenCalledOnce();
  });

  it("maxWait: forces execution after maxWait ms even if calls keep coming", async () => {
    const fn = vi.fn().mockReturnValue("forced");
    const wrapped = createFilterWrapper(debounceFilter(300, { maxWait: 500 }), fn);

    // Keep calling every 100ms — debounce would normally keep resetting
    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    wrapped();
    await vi.advanceTimersByTimeAsync(100);
    // 300ms elapsed — debounce not yet fired (kept resetting), but maxWait (500ms) not yet
    expect(fn).not.toHaveBeenCalled();

    // Advance to 500ms total — maxWait fires
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("maxWait: after maxWait fires, next call starts a fresh debounce window", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(debounceFilter(300, { maxWait: 500 }), fn);

    wrapped();
    await vi.advanceTimersByTimeAsync(500); // maxWait fires
    expect(fn).toHaveBeenCalledTimes(1);

    // New call starts fresh
    wrapped();
    await vi.advanceTimersByTimeAsync(300); // normal debounce fires
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("throttleFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles calls — fires at most once per interval", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(throttleFilter(100), fn);

    wrapped();
    wrapped();
    wrapped();

    // Leading edge: first call fires immediately (es-toolkit throttle leading=true by default)
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);

    // Trailing edge fires after interval
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("accepts Observable<number> for reactive ms", async () => {
    const ms$ = observable(100);
    const fn = vi.fn();
    const wrapped = createFilterWrapper(throttleFilter(ms$), fn);

    wrapped();
    expect(fn).toHaveBeenCalledTimes(1);

    ms$.set(200);
    await vi.advanceTimersByTimeAsync(100);
    wrapped(); // new throttle interval: 200ms
    expect(fn).toHaveBeenCalledTimes(2); // fires immediately (new throttled instance, leading=true)
  });

  it("edges: ['leading'] only — fires on first call, no trailing", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(throttleFilter(100, { edges: ["leading"] }), fn);

    wrapped();
    wrapped();
    wrapped();

    expect(fn).toHaveBeenCalledTimes(1); // leading fires

    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(1); // no trailing
  });

  it("edges: ['trailing'] only — first call suppressed, fires after interval", async () => {
    const fn = vi.fn();
    const wrapped = createFilterWrapper(throttleFilter(100, { edges: ["trailing"] }), fn);

    wrapped();
    expect(fn).not.toHaveBeenCalled(); // no leading

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1); // trailing fires
  });

  it("throttled calls resolve with previous result (lastResult pattern)", async () => {
    const fn = vi.fn().mockReturnValue("v1");
    const wrapped = createFilterWrapper(throttleFilter(100), fn);

    const p1 = wrapped(); // leading — executes fn, returns "v1"
    fn.mockReturnValue("v2");
    const p2 = wrapped(); // throttled — should return lastResult "v1"

    await vi.advanceTimersByTimeAsync(100); // trailing fires with "v2"

    await expect(p1).resolves.toBe("v1");
    await expect(p2).resolves.toBe("v1"); // lastResult from previous call
  });
});
