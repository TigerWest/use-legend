/* eslint-disable @typescript-eslint/no-unused-vars */
import { observable } from "@legendapp/state";
import { describe, expectTypeOf, it } from "vitest";
import { watch, useWatch, type Effector } from ".";

describe("useWatch() — types", () => {
  describe("Effector<W> — generic inference", () => {
    it("single-element array → [T]", () => {
      const a$ = observable("hello");
      type W = [typeof a$];
      expectTypeOf<Effector<W>>().toEqualTypeOf<(values: [string]) => void>();
    });

    it("two-element array → [T1, T2]", () => {
      const a$ = observable(1);
      const b$ = observable("world");
      type W = [typeof a$, typeof b$];
      expectTypeOf<Effector<W>>().toEqualTypeOf<(values: [number, string]) => void>();
    });

    it("three-element array → [T1, T2, T3]", () => {
      const a$ = observable(0);
      const b$ = observable(42);
      const c$ = observable("text");
      type W = [typeof a$, typeof b$, typeof c$];
      expectTypeOf<Effector<W>>().toEqualTypeOf<(values: [number, number, string]) => void>();
    });

    it("function selector → (value: T) => void", () => {
      type W = () => number;
      expectTypeOf<Effector<W>>().toEqualTypeOf<(value: number) => void>();
    });

    it("reactive selector () => obs$.get() → infers return type", () => {
      const source$ = observable("hello");
      type W = () => ReturnType<typeof source$.get>;
      expectTypeOf<Effector<W>>().toEqualTypeOf<(value: string) => void>();
    });

    it("Observable selector → (value: T) => void", () => {
      const a$ = observable(42);
      type W = typeof a$;
      expectTypeOf<Effector<W>>().toEqualTypeOf<(value: number) => void>();
    });
  });

  describe("watch() — call-site inference", () => {
    it("array selector → effect receives tuple", () => {
      const a$ = observable(1);
      const b$ = observable("hello");
      watch([a$, b$] as const, (values) => {
        expectTypeOf(values).toEqualTypeOf<[number, string]>();
      });
    });

    it("mixed array [() => T, Observable<U>] → effect receives [T, U]", () => {
      const a$ = observable(1);
      const b$ = observable("hello");
      watch([() => a$.get(), b$] as const, (values) => {
        expectTypeOf(values).toEqualTypeOf<[number, string]>();
      });
    });

    it("function selector → effect receives return value", () => {
      const count$ = observable(0);
      watch(
        () => count$.get(),
        (value) => {
          expectTypeOf(value).toEqualTypeOf<number>();
        }
      );
    });

    it("single Observable selector → effect receives value", () => {
      const flag$ = observable(false);
      watch(flag$, (value) => {
        expectTypeOf(value).toEqualTypeOf<boolean>();
      });
    });
  });

  describe("useWatch() — call-site inference", () => {
    it("array selector → effect receives tuple", () => {
      const a$ = observable(1);
      const b$ = observable("hello");
      const useCheck = () =>
        useWatch([a$, b$] as const, (values) => {
          expectTypeOf(values).toEqualTypeOf<[number, string]>();
        });
      void useCheck;
    });

    it("function selector → effect receives return value", () => {
      const count$ = observable(0);
      const useCheck = () =>
        useWatch(
          () => count$.get(),
          (value) => {
            expectTypeOf(value).toEqualTypeOf<number>();
          }
        );
      void useCheck;
    });

    it("single Observable selector → effect receives value", () => {
      const flag$ = observable(false);
      const useCheck = () =>
        useWatch(flag$, (value) => {
          expectTypeOf(value).toEqualTypeOf<boolean>();
        });
      void useCheck;
    });
  });
});
