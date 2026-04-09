// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { renderHook } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { DataHistoryReturn, useThrottledHistory } from ".";
import type { ReadonlyObservable, UseHistoryRecord } from "../../types";

describe("useThrottledHistory() — types", () => {
  describe("return type", () => {
    it("returns UseThrottledHistoryReturn<Raw>", () => {
      const source$ = observable(0);
      renderHook(() => {
        const result = useThrottledHistory(source$);
        expectTypeOf(result).toEqualTypeOf<DataHistoryReturn<number>>();
      });
    });

    it("history$ is ReadonlyObservable of records", () => {
      const source$ = observable("");
      renderHook(() => {
        const { history$ } = useThrottledHistory(source$);
        expectTypeOf(history$).toEqualTypeOf<ReadonlyObservable<UseHistoryRecord<string>[]>>();
      });
    });
  });

  describe("generic inference", () => {
    it("infers Raw from source$ Observable<T>", () => {
      const source$ = observable(42);
      renderHook(() => {
        const result = useThrottledHistory(source$);
        expectTypeOf(result).toEqualTypeOf<DataHistoryReturn<number>>();
      });
    });

    it("infers Serialized = Raw when not provided", () => {
      const source$ = observable("hello");
      renderHook(() => {
        const { commit } = useThrottledHistory(source$);
        expectTypeOf(commit).toEqualTypeOf<() => void>();
      });
    });

    it("accepts explicit Raw and Serialized type params", () => {
      const source$ = observable("hello");
      renderHook(() => {
        const result = useThrottledHistory<string, number>(source$, {
          dump: (v) => v.length,
          parse: (n) => String(n),
        });
        expectTypeOf(result).toEqualTypeOf<DataHistoryReturn<string, number>>();
      });
    });
  });

  describe("options", () => {
    it("accepts plain throttle number", () => {
      const source$ = observable(0);
      renderHook(() => {
        useThrottledHistory(source$, { throttle: 300 });
      });
    });

    it("accepts Observable throttle", () => {
      const source$ = observable(0);
      const throttle$ = observable(300);
      renderHook(() => {
        useThrottledHistory(source$, { throttle: throttle$ });
      });
    });
  });
});
