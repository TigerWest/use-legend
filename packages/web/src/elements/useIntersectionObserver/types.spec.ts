import { describe, it, expectTypeOf } from "vitest";
import { observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
} from ".";

describe("useIntersectionObserver() — types", () => {
  describe("option types", () => {
    it("options accepts plain boolean for immediate", () => {
      const _: UseIntersectionObserverOptions = { immediate: false };
      expectTypeOf(_).toMatchTypeOf<UseIntersectionObserverOptions>();
    });

    it("options accepts plain string for rootMargin", () => {
      const _: UseIntersectionObserverOptions = { rootMargin: "10px" };
      expectTypeOf(_).toMatchTypeOf<UseIntersectionObserverOptions>();
    });

    it("options accepts plain number for threshold", () => {
      const _: UseIntersectionObserverOptions = { threshold: 0.5 };
      expectTypeOf(_).toMatchTypeOf<UseIntersectionObserverOptions>();
    });

    it("options accepts number array for threshold", () => {
      const _: UseIntersectionObserverOptions = { threshold: [0, 0.5, 1] };
      expectTypeOf(_).toMatchTypeOf<UseIntersectionObserverOptions>();
    });

    it("accepts Observable<string> for rootMargin option", () => {
      expectTypeOf<typeof useIntersectionObserver>().toBeCallableWith(
        null,
        (_entries: IntersectionObserverEntry[]) => {},
        { rootMargin: observable("10px") }
      );
    });

    it("accepts null as target", () => {
      expectTypeOf<typeof useIntersectionObserver>().toBeCallableWith(
        null,
        (_entries: IntersectionObserverEntry[]) => {}
      );
    });

    it("rejects invalid type for rootMargin", () => {
      // @ts-expect-error — rootMargin must be string | Observable<string>, not number
      const _: UseIntersectionObserverOptions = { rootMargin: 42 };
    });

    it("rejects invalid type for threshold", () => {
      // @ts-expect-error — threshold must be number | number[], not string
      const _: UseIntersectionObserverOptions = { threshold: "high" };
    });
  });

  describe("return type", () => {
    it("returns UseIntersectionObserverReturn with correct shape", () => {
      expectTypeOf<UseIntersectionObserverReturn>().toHaveProperty("isSupported$");
      expectTypeOf<UseIntersectionObserverReturn>().toHaveProperty("isActive$");
      expectTypeOf<UseIntersectionObserverReturn>().toHaveProperty("pause");
      expectTypeOf<UseIntersectionObserverReturn>().toHaveProperty("resume");
      expectTypeOf<UseIntersectionObserverReturn>().toHaveProperty("stop");
    });

    it("isSupported$ is ReadonlyObservable<boolean>", () => {
      expectTypeOf<UseIntersectionObserverReturn["isSupported$"]>().toEqualTypeOf<
        ReadonlyObservable<boolean>
      >();
    });

    it("isActive$ is ReadonlyObservable<boolean>", () => {
      expectTypeOf<UseIntersectionObserverReturn["isActive$"]>().toEqualTypeOf<
        ReadonlyObservable<boolean>
      >();
    });

    it("pause is a function returning void", () => {
      expectTypeOf<UseIntersectionObserverReturn["pause"]>().toEqualTypeOf<() => void>();
    });

    it("resume is a function returning void", () => {
      expectTypeOf<UseIntersectionObserverReturn["resume"]>().toEqualTypeOf<() => void>();
    });

    it("stop is a function returning void", () => {
      expectTypeOf<UseIntersectionObserverReturn["stop"]>().toEqualTypeOf<() => void>();
    });
  });
});
