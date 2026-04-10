// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { renderHook } from "@testing-library/react";
import { observable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { useScope, toObs } from ".";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";

describe("useScope() — types", () => {
  describe("overloads", () => {
    it("single-props overload infers correct prop field types", () => {
      renderHook(() =>
        useScope(
          (p) => {
            expectTypeOf(p.a).toBeNumber();
            return {};
          },
          { a: 1 }
        )
      );
    });

    it("2 rest args: each param infers correct field types", () => {
      renderHook(() =>
        useScope(
          (timing, opts) => {
            expectTypeOf(timing.debounce).toBeNumber();
            expectTypeOf(opts.name).toBeString();
            return {};
          },
          { debounce: 200 },
          { name: "test" }
        )
      );
    });

    it("2 rest args with DeepMaybeObservable: each param infers unwrapped field types", () => {
      interface ScalarProps {
        interval: number;
      }
      interface OptProps {
        callback?: (n: number) => void;
        immediate?: boolean;
      }
      renderHook(() =>
        useScope(
          (scalars, opts) => {
            expectTypeOf(scalars.interval).toBeNumber();
            const s$ = toObs(scalars);
            expectTypeOf(s$.interval).toEqualTypeOf<Observable<number>>();
            const o$ = toObs(opts, { callback: "function" });
            expectTypeOf(o$.immediate).toEqualTypeOf<Observable<boolean | undefined>>();
            return {};
          },
          { interval: 1000 } as ScalarProps,
          {} as DeepMaybeObservable<OptProps>
        )
      );
    });

    it("3 rest args: each param infers correct field types", () => {
      renderHook(() =>
        useScope(
          (a, b, c) => {
            expectTypeOf(a.x).toBeNumber();
            expectTypeOf(b.y).toBeString();
            expectTypeOf(c.z).toBeBoolean();
            return {};
          },
          { x: 1 },
          { y: "hello" },
          { z: true }
        )
      );
    });
  });

  describe("toObs scalar hint", () => {
    it("toObs with scalar hint accepts string hint", () => {
      renderHook(() =>
        useScope(
          (p) => {
            toObs(p, "function");
            return {};
          },
          { onClick: () => {}, onHover: () => {} }
        )
      );
    });
  });

  describe("toObs with MaybeObservable props", () => {
    it("MaybeObservable<number> field is not any", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            expectTypeOf(p$.throttle).not.toBeAny();
            return {};
          },
          { throttle: 200 as MaybeObservable<number> | undefined }
        )
      );
    });

    it("MaybeObservable<number> field resolves to Observable<number | undefined>", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            expectTypeOf(p$.throttle).toEqualTypeOf<Observable<number | undefined>>();
            return {};
          },
          { throttle: 200 as MaybeObservable<number> | undefined }
        )
      );
    });

    it("plain function field with 'function' hint is not any", () => {
      type CB = (v: number) => string;
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p, { dump: "function" });
            expectTypeOf(p$.dump).not.toBeAny();
            return {};
          },
          { dump: undefined as CB | undefined }
        )
      );
    });

    it("plain boolean field is not any", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            expectTypeOf(p$.trailing).not.toBeAny();
            expectTypeOf(p$.trailing).toEqualTypeOf<Observable<boolean | undefined>>();
            return {};
          },
          { trailing: true as boolean | undefined }
        )
      );
    });
  });

  describe("toObs nested hints", () => {
    it("field-level opaque hint wraps that field in OpaqueObject", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p, { data: "opaque" });
            // Positive: the data field is wrapped in OpaqueObject
            expectTypeOf(p$.data).toEqualTypeOf<
              import("@legendapp/state").Observable<
                import("@legendapp/state").OpaqueObject<{ id: number } & object>
              >
            >();
            // Negative: it's no longer the plain { id: number } shape
            expectTypeOf(p$.data).not.toEqualTypeOf<
              import("@legendapp/state").Observable<{ id: number }>
            >();
            return {};
          },
          { data: { id: 1 } }
        )
      );
    });

    it("nested map hint: sub-field opaque wraps only that sub-field", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const _p$ = toObs(p, { nested: { some1: "opaque" } });
            // nested.some1 should be OpaqueObject
            type Some1Type = (typeof _p$)["nested"] extends import("@legendapp/state").Observable<
              infer U
            >
              ? U extends { some1: infer S }
                ? S
                : never
              : never;
            expectTypeOf<Some1Type>().toMatchTypeOf<
              import("@legendapp/state").OpaqueObject<object>
            >();
            // nested.some2 should remain plain string
            type Some2Type = (typeof _p$)["nested"] extends import("@legendapp/state").Observable<
              infer U
            >
              ? U extends { some2: infer S }
                ? S
                : never
              : never;
            expectTypeOf<Some2Type>().toEqualTypeOf<string>();
            return {};
          },
          { nested: { some1: { id: 1 }, some2: "hello" } }
        )
      );
    });

    it("scalar opaque hint wraps entire props in OpaqueObject", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p, "opaque");
            // Positive: the whole props type is OpaqueObject
            expectTypeOf(p$).toEqualTypeOf<
              import("@legendapp/state").Observable<
                import("@legendapp/state").OpaqueObject<{ count: number } & object>
              >
            >();
            // Negative: it's no longer Observable<{ count: number }>
            expectTypeOf(p$).not.toEqualTypeOf<
              import("@legendapp/state").Observable<{ count: number }>
            >();
            return {};
          },
          { count: 0 }
        )
      );
    });

    it("non-hinted fields remain their original type", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p, { cb: "function" });
            expectTypeOf(p$.count).not.toBeAny();
            // Positive: count is still Observable<number>
            expectTypeOf(p$.count).toEqualTypeOf<import("@legendapp/state").Observable<number>>();
            return {};
          },
          { count: 0, cb: () => {} }
        )
      );
    });

    it("plain hint does not change the field type", () => {
      renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p, { data: "plain" });
            expectTypeOf(p$.data).not.toBeAny();
            // plain does not wrap in OpaqueObject — type stays as-is
            expectTypeOf(p$.count).toEqualTypeOf<import("@legendapp/state").Observable<number>>();
            return {};
          },
          { data: { id: 1 }, count: 0 }
        )
      );
    });
  });

  describe("interface props without index signature", () => {
    interface MyOptions {
      interval?: number;
      immediate?: boolean;
      onTick?: (n: number) => void;
    }

    it("interface props: toObs field resolves to correct Observable type", () => {
      renderHook(() =>
        useScope((p) => {
          const p$ = toObs(p, { onTick: "function" });
          expectTypeOf(p$.interval).toEqualTypeOf<Observable<number | undefined>>();
          expectTypeOf(p$.immediate).toEqualTypeOf<Observable<boolean | undefined>>();
          return {};
        }, {} as MyOptions)
      );
    });

    it("interface props: raw prop access returns correct type", () => {
      renderHook(() =>
        useScope((p) => {
          expectTypeOf(p.interval).toEqualTypeOf<number | undefined>();
          expectTypeOf(p.onTick).toEqualTypeOf<((n: number) => void) | undefined>();
          return {};
        }, {} as MyOptions)
      );
    });
  });

  describe("Observable props", () => {
    interface MyOptions {
      interval?: number;
      label?: string;
    }

    it("Observable<P> props: factory receives ReactiveProps<P> with correct field types", () => {
      const opts$ = observable<MyOptions>({});
      renderHook(() =>
        useScope((p) => {
          expectTypeOf(p.interval).toEqualTypeOf<number | undefined>();
          expectTypeOf(p.label).toEqualTypeOf<string | undefined>();
          return {};
        }, opts$)
      );
    });

    it("Observable<P> props: toObs returns Observable with P field types", () => {
      const opts$ = observable<MyOptions>({});
      renderHook(() =>
        useScope((p) => {
          const p$ = toObs(p);
          expectTypeOf(p$.interval).toEqualTypeOf<Observable<number | undefined>>();
          expectTypeOf(p$.label).toEqualTypeOf<Observable<string | undefined>>();
          return {};
        }, opts$)
      );
    });
  });

  describe("DeepMaybeObservable props unwrap via InferBaseFromDeep", () => {
    interface MyOptions {
      interval?: number;
      immediate?: boolean;
      onTick?: (n: number) => void;
    }

    it("DeepMaybeObservable<P> props: toObs returns Observable with unwrapped P field types", () => {
      renderHook(() =>
        useScope((p) => {
          const p$ = toObs(p, { onTick: "function" });
          expectTypeOf(p$.interval).toEqualTypeOf<Observable<number | undefined>>();
          expectTypeOf(p$.immediate).toEqualTypeOf<Observable<boolean | undefined>>();
          return {};
        }, {} as DeepMaybeObservable<MyOptions>)
      );
    });

    it("DeepMaybeObservable<P> props: raw prop access returns unwrapped field types", () => {
      renderHook(() =>
        useScope((p) => {
          expectTypeOf(p.interval).toEqualTypeOf<number | undefined>();
          expectTypeOf(p.onTick).toEqualTypeOf<((n: number) => void) | undefined>();
          return {};
        }, {} as DeepMaybeObservable<MyOptions>)
      );
    });
  });
});
