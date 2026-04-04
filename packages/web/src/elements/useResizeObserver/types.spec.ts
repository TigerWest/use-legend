// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { observable, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";
import { useRef$ } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { useResizeObserver, type UseResizeObserverReturn, type UseResizeObserverOptions } from ".";

describe("useResizeObserver() — types", () => {
  // ---------------------------------------------------------------------------
  // return type
  // ---------------------------------------------------------------------------

  describe("return type", () => {
    it("returns UseResizeObserverReturn", () => {
      expectTypeOf<typeof useResizeObserver>().returns.toEqualTypeOf<UseResizeObserverReturn>();
    });

    it("return type has stop function", () => {
      expectTypeOf<UseResizeObserverReturn["stop"]>().toEqualTypeOf<() => void>();
    });
  });

  // ---------------------------------------------------------------------------
  // overloads
  // ---------------------------------------------------------------------------

  describe("overloads", () => {
    it("accepts single Element target via Observable<OpaqueObject<Element>>", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(div));
      expectTypeOf<typeof useResizeObserver>().toBeCallableWith(
        target$ as Observable<OpaqueObject<Element> | null>,
        vi.fn()
      );
    });

    it("accepts Element[] array target", () => {
      const div = document.createElement("div");
      const span = document.createElement("span");
      const t1$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));
      const t2$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(span));
      expectTypeOf<typeof useResizeObserver>().toBeCallableWith(
        [t1$, t2$] as MaybeEventTarget[],
        vi.fn()
      );
    });

    it("accepts Ref$ target", () => {
      expectTypeOf<typeof useResizeObserver>().toBeCallableWith(
        undefined as unknown as ReturnType<typeof useRef$<HTMLDivElement>>,
        vi.fn()
      );
    });

    it("accepts null as target", () => {
      expectTypeOf<typeof useResizeObserver>().toBeCallableWith(null, vi.fn());
    });

    it("accepts options as third argument", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));
      expectTypeOf<typeof useResizeObserver>().toBeCallableWith(target$, vi.fn(), {
        box: "border-box",
      } satisfies UseResizeObserverOptions);
    });
  });

  // ---------------------------------------------------------------------------
  // generic inference
  // ---------------------------------------------------------------------------

  describe("generic inference", () => {
    it("callback entries type matches ResizeObserverCallback", () => {
      // The callback parameter must be ResizeObserverCallback
      expectTypeOf<typeof useResizeObserver>().parameter(1).toEqualTypeOf<ResizeObserverCallback>();
    });

    it("options box accepts only valid box model strings", () => {
      // @ts-expect-error — 'invalid-box' is not a valid box value
      const _: UseResizeObserverOptions = { box: "invalid-box" };
    });
  });
});

// ---------------------------------------------------------------------------
// vi stub — types.spec.ts doesn't run hooks at runtime but vi.fn() is used
// for type-only callable checks; declare vi to satisfy TypeScript in this file.
// ---------------------------------------------------------------------------
declare const vi: { fn: () => ResizeObserverCallback };
