import { describe, it, expectTypeOf } from "vitest";
import { observable as legendObservable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { observable } from "@shared/observable";
import type { DeepMaybeObservable } from "../types";
import type { ManualHistoryOptions } from "../state/useManualHistory/core";
import type { DataHistoryOptions } from "../state/useDataHistory/core";
import type { DebouncedHistoryOptions } from "../state/useDebouncedHistory/core";
import type { ThrottledHistoryOptions } from "../state/useThrottledHistory/core";

// ---------------------------------------------------------------------------
// Sanity check: our observable and legendObservable are the same value
// ---------------------------------------------------------------------------
const _check: typeof legendObservable = observable as typeof legendObservable;
void _check;

describe("observable() — DeepMaybeObservable overloads", () => {
  describe("core fix: DeepMaybeObservable<T> → Observable<T>", () => {
    it("plain DeepMaybeObservable<T> → Observable<T>", () => {
      const opts: DeepMaybeObservable<{ count: number }> = { count: 1 };
      expectTypeOf(observable(opts)).toEqualTypeOf<Observable<{ count: number }>>();
    });

    it("optional DeepMaybeObservable<T> → Observable<T | undefined>", () => {
      // Explicit type arg bypasses concrete-type alias expansion issue with inference
      const opts: DeepMaybeObservable<{ count: number }> | undefined = undefined;
      expectTypeOf(observable<{ count: number }>(opts)).toEqualTypeOf<
        Observable<{ count: number } | undefined>
      >();
    });
  });

  describe("existing option types — compatibility", () => {
    it("ManualHistoryOptions", () => {
      const opts: DeepMaybeObservable<ManualHistoryOptions<string>> | undefined = undefined;
      expectTypeOf(observable<ManualHistoryOptions<string>>(opts)).toEqualTypeOf<
        Observable<ManualHistoryOptions<string> | undefined>
      >();
    });

    it("DataHistoryOptions", () => {
      const opts: DeepMaybeObservable<DataHistoryOptions<string>> | undefined = undefined;
      expectTypeOf(observable<DataHistoryOptions<string>>(opts)).toEqualTypeOf<
        Observable<DataHistoryOptions<string> | undefined>
      >();
    });

    it("DebouncedHistoryOptions", () => {
      const opts: DeepMaybeObservable<DebouncedHistoryOptions<string>> | undefined = undefined;
      expectTypeOf(observable<DebouncedHistoryOptions<string>>(opts)).toEqualTypeOf<
        Observable<DebouncedHistoryOptions<string> | undefined>
      >();
    });

    it("ThrottledHistoryOptions", () => {
      const opts: DeepMaybeObservable<ThrottledHistoryOptions<string>> | undefined = undefined;
      expectTypeOf(observable<ThrottledHistoryOptions<string>>(opts)).toEqualTypeOf<
        Observable<ThrottledHistoryOptions<string> | undefined>
      >();
    });
  });

  describe("must not break: computed observables", () => {
    it("() => number → Observable<number>", () => {
      expectTypeOf(observable(() => 200)).toEqualTypeOf<Observable<number>>();
    });

    it("() => string → Observable<string>", () => {
      expectTypeOf(observable(() => "hello")).toEqualTypeOf<Observable<string>>();
    });

    it("() => object → Observable<object>", () => {
      expectTypeOf(observable(() => ({ capacity: 1 }))).toEqualTypeOf<
        Observable<{ capacity: number }>
      >();
    });
  });

  describe("must not break: primitive literal widening", () => {
    it("number literal → Observable<number> (not Observable<0>)", () => {
      expectTypeOf(observable(0)).toEqualTypeOf<Observable<number>>();
    });

    it("string literal → Observable<string>", () => {
      expectTypeOf(observable("hi")).toEqualTypeOf<Observable<string>>();
    });

    it("boolean literal → Observable<boolean>", () => {
      expectTypeOf(observable(true)).toEqualTypeOf<Observable<boolean>>();
    });
  });

  describe("must not break: no-arg observable", () => {
    it("observable<number>() → Observable<number | undefined>", () => {
      expectTypeOf(observable<number>()).toEqualTypeOf<Observable<number | undefined>>();
    });
  });
});
