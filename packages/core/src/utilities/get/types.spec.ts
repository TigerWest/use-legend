import { describe, it, expectTypeOf } from "vitest";
import { observable } from "@legendapp/state";
import { get } from ".";
import type { MaybeObservable, DeepMaybeObservable } from "../../types";
import type { DataHistoryOptions } from "../../state/useDataHistory/core";
import type { EventFilter } from "../../shared/filters";

describe("get() — types", () => {
  describe("DeepMaybeObservable<T> overload — core fix", () => {
    it("plain DeepMaybeObservable<T> → T", () => {
      const opts: DeepMaybeObservable<DataHistoryOptions<string>> = {};
      expectTypeOf(get(opts)).toEqualTypeOf<DataHistoryOptions<string>>();
    });

    it("DeepMaybeObservable<T> | undefined → T | undefined", () => {
      // Type assertion prevents TypeScript from narrowing to `undefined` literal
      const opts = undefined as DeepMaybeObservable<DataHistoryOptions<string>> | undefined;
      expectTypeOf(get(opts)).toEqualTypeOf<DataHistoryOptions<string> | undefined>();
    });

    it("Observable<T> → T (handled by { get(): T } overload)", () => {
      const opts$ = observable({ capacity: 5, deep: true });
      expectTypeOf(get(opts$)).toEqualTypeOf<{ capacity: number; deep: boolean }>();
    });

    it("fields of result are plain — per-field MaybeObservable variant does not leak", () => {
      // Regression: without the DeepMaybeObservable overload, rawOpts.eventFilter was
      // typed as MaybeObservable<EventFilter> instead of EventFilter | undefined
      const opts = undefined as DeepMaybeObservable<DataHistoryOptions<string>> | undefined;
      const rawOpts = get(opts);
      expectTypeOf(rawOpts?.eventFilter).toEqualTypeOf<EventFilter | undefined>();
    });
  });

  describe("MaybeObservable<T> overload — not broken by new overloads", () => {
    it("MaybeObservable<number> → number", () => {
      const v: MaybeObservable<number> = 42;
      expectTypeOf(get(v)).toEqualTypeOf<number>();
    });

    it("MaybeObservable<number> | undefined → number | undefined", () => {
      // Type assertion prevents narrowing to `undefined` literal
      const v = undefined as MaybeObservable<number> | undefined;
      expectTypeOf(get(v)).toEqualTypeOf<number | undefined>();
    });
  });
});
