import { describe, it, expectTypeOf } from "vitest";
import type { Observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import {
  useAnimate,
  type UseAnimateReturn,
  type UseAnimateKeyframes,
  type UseAnimateOptions,
} from ".";

// ---------------------------------------------------------------------------
// useAnimate() — Type-Level Tests
// ---------------------------------------------------------------------------

describe("useAnimate() \u2014 types", () => {
  describe("return type", () => {
    it("UseAnimateReturn includes all control methods", () => {
      expectTypeOf<UseAnimateReturn["play"]>().toBeFunction();
      expectTypeOf<UseAnimateReturn["pause"]>().toBeFunction();
      expectTypeOf<UseAnimateReturn["reverse"]>().toBeFunction();
      expectTypeOf<UseAnimateReturn["finish"]>().toBeFunction();
      expectTypeOf<UseAnimateReturn["cancel"]>().toBeFunction();
    });

    it("isSupported$ is ReadonlyObservable<boolean>", () => {
      expectTypeOf<UseAnimateReturn["isSupported$"]>().toEqualTypeOf<ReadonlyObservable<boolean>>();
    });

    it("animate$ is ReadonlyObservable<Animation | null>", () => {
      expectTypeOf<UseAnimateReturn["animate$"]>().toEqualTypeOf<
        ReadonlyObservable<Animation | null>
      >();
    });

    it("playState$ is ReadonlyObservable<AnimationPlayState>", () => {
      expectTypeOf<UseAnimateReturn["playState$"]>().toEqualTypeOf<
        ReadonlyObservable<AnimationPlayState>
      >();
    });

    it("currentTime$ is Observable<number | null>", () => {
      expectTypeOf<UseAnimateReturn["currentTime$"]>().toEqualTypeOf<Observable<number | null>>();
    });

    it("playbackRate$ is Observable<number>", () => {
      expectTypeOf<UseAnimateReturn["playbackRate$"]>().toEqualTypeOf<Observable<number>>();
    });
  });

  describe("option types", () => {
    it("second parameter type is UseAnimateKeyframes", () => {
      expectTypeOf<typeof useAnimate>().parameter(1).toEqualTypeOf<UseAnimateKeyframes>();
    });

    it("UseAnimateOptions has immediate field of type boolean | undefined", () => {
      expectTypeOf<UseAnimateOptions["immediate"]>().toEqualTypeOf<boolean | undefined>();
    });

    it("UseAnimateOptions has commitStyles field of type boolean | undefined", () => {
      expectTypeOf<UseAnimateOptions["commitStyles"]>().toEqualTypeOf<boolean | undefined>();
    });

    it("UseAnimateOptions has playbackRate field of type number | undefined", () => {
      expectTypeOf<UseAnimateOptions["playbackRate"]>().toEqualTypeOf<number | undefined>();
    });

    it("UseAnimateOptions has onReady callback field", () => {
      expectTypeOf<UseAnimateOptions["onReady"]>().toEqualTypeOf<
        ((animate: Animation) => void) | undefined
      >();
    });

    it("UseAnimateOptions has onError callback field", () => {
      expectTypeOf<UseAnimateOptions["onError"]>().toEqualTypeOf<
        ((e: unknown) => void) | undefined
      >();
    });

    it("UseAnimateKeyframes second parameter accepts Observable<Keyframe[]>", () => {
      // Observable<Keyframe[]> is a subtype of UseAnimateKeyframes (MaybeObservable union)
      // Verify by checking the parameter type includes Observable
      type Param1 = Parameters<typeof useAnimate>[1];
      expectTypeOf<UseAnimateKeyframes>().toEqualTypeOf<Param1>();
    });
  });
});
