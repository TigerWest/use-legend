import { describe, it, expect } from "vitest";
import { observable, ObservableHint, observe } from "@legendapp/state";

/**
 * Defensive tests documenting the real runtime behavior of
 * `ObservableHint.function` in @legendapp/state v3 beta.
 *
 * These tests pin down counter-intuitive behavior so that future Legend-State
 * upgrades surface any change. They are NOT a spec we control — they record
 * what we observed so callers and guides stay honest.
 *
 * Observed rules (beta.44):
 *   - `ObservableHint.function` is an alias of `ObservableHint.plain`
 *     — both attach the same `symbolPlain` tag.
 *   - `.get()` auto-invokes a hinted function and returns its RESULT.
 *     Accessing the same field via `parent.peek()` BEFORE `.get()` returns
 *     the function reference; AFTER `.get()` is warmed, `peek()` returns the
 *     cached result. This asymmetry is a Legend-State internal concern.
 *   - Direct-call paths:
 *       * NO-ARG `obs$.fn()` — caches the first invocation's result as a
 *         computed-selector read; `.set()` does not flip it, regardless of
 *         hint. Never use this form to dispatch a callback.
 *       * ARG `obs$.fn(x)` with hint — still dispatches to the first
 *         function (hint keeps the call on the cache path).
 *       * ARG `obs$.fn(x)` WITHOUT hint — dispatches to the LATEST function
 *         after `.set()`. Works for callback dispatch, but `peek()` form is
 *         preferred for clarity.
 *   - `observe(() => obs$.fn())` does NOT register a dependency on the
 *     replacement, so it never re-runs when the function is swapped
 *     (hint or no hint — direct-call path bypasses tracking).
 *   - `observe(() => obs$.fn.get())` DOES register a dependency and re-runs.
 *
 * Guidance:
 *   - Store callback props WITHOUT the `"function"` hint.
 *   - Invoke callbacks via raw-prop access (`p.onX?.()`) or
 *     `obs$.peek().onX?.()`. Direct call (`obs$.onX?.()`) works for no-hint,
 *     but `peek()` makes the non-reactive dispatch intent explicit.
 *
 * If any assertion here starts failing after a Legend-State upgrade, revisit
 * `.claude/rules/library-implementation-guide.md` — the `toObs(p, { onX: "function" })`
 * guidance depends on the behavior pinned here.
 */
describe("ObservableHint.function — runtime behavior contract", () => {
  it("is structurally identical to ObservableHint.plain (returns the same object)", () => {
    const target = { k: 1 };
    const hinted = ObservableHint.function(target);
    expect(hinted).toBe(target);
  });

  describe(".get() auto-invokes hinted functions", () => {
    it(".get() returns the function's RESULT, not the function reference", () => {
      const fn = () => "A";
      const obs$ = observable({ fn: ObservableHint.function(fn) });
      expect(obs$.fn.get()).toBe("A");
    });

    it(".get() DOES reflect the latest function after .set()", () => {
      const fnA = () => "A";
      const fnB = () => "B";
      const obs$ = observable({ fn: ObservableHint.function(fnA) });
      expect(obs$.fn.get()).toBe("A");
      obs$.fn.set(fnB);
      expect(obs$.fn.get()).toBe("B");
    });

    it("parent peek() BEFORE any .get() warms returns the function reference", () => {
      const fn = () => "A";
      const obs$ = observable({ fn: ObservableHint.function(fn) });
      // Cold state: peek yields the raw reference.
      const snap = obs$.peek();
      expect(snap.fn).toBe(fn);
    });

    it("parent peek() AFTER .get() warms returns the cached result string", () => {
      const fn = () => "A";
      const obs$ = observable({ fn: ObservableHint.function(fn) });
      obs$.fn.get(); // warm
      const snap = obs$.peek();
      // Warmed state: the internal cache has replaced the field with the result.
      expect(snap.fn).toBe("A");
    });
  });

  describe("direct-call path is unreliable across replacements", () => {
    it("HINTED: obs$.fn() keeps returning the first function's result after .set()", () => {
      const fnA = () => "A";
      const fnB = () => "B";
      const obs$ = observable({ fn: ObservableHint.function(fnA) });
      expect(obs$.fn()).toBe("A");
      obs$.fn.set(fnB);
      // ⚠️ counter-intuitive: still "A".
      expect(obs$.fn()).toBe("A");
    });

    it("NO HINT: obs$.onSubmit(arg) uses the LATEST function after .set()", () => {
      const fnA = (x: number) => `A:${x}`;
      const fnB = (x: number) => `B:${x}`;
      // Cast: legend-state's observable() overloads reject bare function values
      // as object properties in the type system, but accept them at runtime.
      const obs$ = observable({ onSubmit: fnA as unknown as object });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.onSubmit as any)(1)).toBe("A:1");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obs$.onSubmit as any).set(fnB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.onSubmit as any)(2)).toBe("B:2");
    });

    it("NO HINT: obs$.onSubmit() no-arg direct call STILL caches the first result", () => {
      // Legend-State treats no-arg calls on a function-valued node as a
      // computed-selector read, memoizing the first result. Hint does not
      // change this — only the arg-call path uses the latest function.
      const fnA = () => "A";
      const fnB = () => "B";
      const obs$ = observable({ onSubmit: fnA as unknown as object });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.onSubmit as any)()).toBe("A");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obs$.onSubmit as any).set(fnB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.onSubmit as any)()).toBe("A"); // ⚠️ stale
    });

    it("SAFE callback dispatch: peek().onSubmit(...) uses the latest function", () => {
      const fnA = (x: number) => `A:${x}`;
      const fnB = (x: number) => `B:${x}`;
      const obs$ = observable({ onSubmit: fnA as unknown as object });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.peek() as any).onSubmit(1)).toBe("A:1");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obs$.onSubmit as any).set(fnB);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((obs$.peek() as any).onSubmit(2)).toBe("B:2");
    });
  });

  describe("observe() tracking", () => {
    it("observe(() => obs$.fn()) does NOT re-run when the function is replaced", () => {
      const fnA = () => "A";
      const fnB = () => "B";
      const obs$ = observable({ fn: ObservableHint.function(fnA) });

      let runs = 0;
      const dispose = observe(() => {
        runs++;
        obs$.fn();
      });
      expect(runs).toBe(1);
      obs$.fn.set(fnB);
      expect(runs).toBe(1); // direct-call path does NOT register dep on replacement
      dispose();
    });

    it("observe(() => obs$.fn.get()) DOES re-run when the function is replaced", () => {
      const fnA = () => "A";
      const fnB = () => "B";
      const obs$ = observable({ fn: ObservableHint.function(fnA) });

      const seen: unknown[] = [];
      const dispose = observe(() => {
        seen.push(obs$.fn.get());
      });
      obs$.fn.set(fnB);
      expect(seen).toEqual(["A", "B"]);
      dispose();
    });
  });

  describe("callback-prop pattern — prefer NO hint + peek() dispatch", () => {
    it("no-hint .get() returns the function REFERENCE (stable for callbacks)", () => {
      const fn = (x: number) => `v${x}`;
      const obs$ = observable({ onSubmit: fn });
      expect(obs$.onSubmit.get()).toBe(fn);
    });

    it("no-hint cold peek() returns the function REFERENCE", () => {
      const fn = (x: number) => `v${x}`;
      const obs$ = observable({ onSubmit: fn });
      expect(obs$.peek().onSubmit).toBe(fn);
    });
  });
});
