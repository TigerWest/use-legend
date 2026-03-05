import { describe, it, expectTypeOf } from "vitest";
import { observable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { useDraggable, type UseDraggableReturn, type UseDraggableOptions, type Position } from ".";
import type { MaybeElement } from "@usels/core";

// ---------------------------------------------------------------------------
// useDraggable() — types
// ---------------------------------------------------------------------------

describe("useDraggable() — types", () => {
  describe("generic constraint", () => {
    it("target accepts HTMLElement wrapped as MaybeElement", () => {
      expectTypeOf<typeof useDraggable>()
        .parameter(0)
        .toExtend<MaybeElement>();
    });

    it("target parameter accepts null", () => {
      expectTypeOf<typeof useDraggable>()
        .toBeCallableWith(null);
    });
  });

  describe("return type", () => {
    it("UseDraggableReturn type includes x$", () => {
      expectTypeOf<UseDraggableReturn["x$"]>()
        .toEqualTypeOf<Observable<number>>();
    });

    it("UseDraggableReturn type includes y$", () => {
      expectTypeOf<UseDraggableReturn["y$"]>()
        .toEqualTypeOf<Observable<number>>();
    });

    it("UseDraggableReturn type includes isDragging$", () => {
      expectTypeOf<UseDraggableReturn["isDragging$"]>()
        .toEqualTypeOf<Observable<boolean>>();
    });

    it("UseDraggableReturn type includes style$", () => {
      expectTypeOf<UseDraggableReturn["style$"]>()
        .toEqualTypeOf<Observable<string>>();
    });

    it("UseDraggableReturn type includes position$", () => {
      expectTypeOf<UseDraggableReturn["position$"]>()
        .toEqualTypeOf<Observable<Position>>();
    });
  });

  describe("option types", () => {
    it("accepts Observable<boolean> for disabled option", () => {
      expectTypeOf<typeof useDraggable>()
        .toBeCallableWith(null, { disabled: observable(false) });
    });

    it("accepts Observable<string> for axis option", () => {
      expectTypeOf<typeof useDraggable>()
        .toBeCallableWith(null, { axis: observable<"x" | "y" | "both">("both") });
    });

    it("accepts plain boolean for disabled option", () => {
      expectTypeOf<typeof useDraggable>()
        .toBeCallableWith(null, { disabled: true });
    });

    it("accepts plain axis string for axis option", () => {
      expectTypeOf<typeof useDraggable>()
        .toBeCallableWith(null, { axis: "x" as const });
    });

    it("rejects invalid axis value", () => {
      // @ts-expect-error — "z" is not a valid axis value
      const _: UseDraggableOptions = { axis: "z" };
    });

    it("rejects number for disabled option", () => {
      // @ts-expect-error — number is not assignable to boolean | Observable<boolean>
      const _: UseDraggableOptions = { disabled: 1 };
    });

    it("Position type has numeric x and y fields", () => {
      expectTypeOf<Position["x"]>().toEqualTypeOf<number>();
      expectTypeOf<Position["y"]>().toEqualTypeOf<number>();
    });
  });
});
