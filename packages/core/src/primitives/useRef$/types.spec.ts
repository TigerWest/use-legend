// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { type Ref$, useRef$ } from ".";

// ---------------------------------------------------------------------------
// useRef$() — types
// ---------------------------------------------------------------------------

describe("useRef$() — types", () => {
  // -------------------------------------------------------------------------
  // generic inference
  // -------------------------------------------------------------------------

  describe("generic inference", () => {
    it("generic T defaults to unknown when no type param", () => {
      expectTypeOf<typeof useRef$>().returns.toEqualTypeOf<Ref$<unknown>>();
    });

    it("generic T is inferred as HTMLDivElement when explicitly provided", () => {
      expectTypeOf<ReturnType<typeof useRef$<HTMLDivElement>>>().toEqualTypeOf<
        Ref$<HTMLDivElement>
      >();
    });

    it("generic T is inferred as HTMLButtonElement when explicitly provided", () => {
      expectTypeOf<ReturnType<typeof useRef$<HTMLButtonElement>>>().toEqualTypeOf<
        Ref$<HTMLButtonElement>
      >();
    });
  });

  // -------------------------------------------------------------------------
  // parameter types
  // -------------------------------------------------------------------------

  describe("parameter types", () => {
    it("accepts an initial value", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>().toBeCallableWith(
        document.createElement("div")
      );
    });

    it("accepts null as initial value", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>().toBeCallableWith(null);
    });

    it("accepts no argument", () => {
      expectTypeOf<typeof useRef$>().toBeCallableWith();
    });

    it("parameter type is T | null | undefined", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>()
        .parameter(0)
        .toEqualTypeOf<HTMLDivElement | null | undefined>();
    });
  });

  // -------------------------------------------------------------------------
  // return type
  // -------------------------------------------------------------------------

  describe("return type", () => {
    it("returned ref$ is callable", () => {
      expectTypeOf<Ref$<HTMLDivElement>>().toBeCallableWith(document.createElement("div"));
    });

    it("returned ref$ is callable with null", () => {
      expectTypeOf<Ref$<HTMLDivElement>>().toBeCallableWith(null);
    });

    it("returned ref$ has get function", () => {
      expectTypeOf<Ref$<HTMLDivElement>["get"]>().toBeFunction();
    });

    it("returned ref$ has peek function", () => {
      expectTypeOf<Ref$<HTMLDivElement>["peek"]>().toBeFunction();
    });

    it("get() returns T or null (auto-unwrapped)", () => {
      expectTypeOf<
        ReturnType<Ref$<HTMLDivElement>["get"]>
      >().toEqualTypeOf<HTMLDivElement | null>();
    });

    it("peek() returns T or null (auto-unwrapped)", () => {
      expectTypeOf<
        ReturnType<Ref$<HTMLDivElement>["peek"]>
      >().toEqualTypeOf<HTMLDivElement | null>();
    });

    it("current returns T or null (auto-unwrapped)", () => {
      expectTypeOf<Ref$<HTMLDivElement>["current"]>().toEqualTypeOf<HTMLDivElement | null>();
    });
  });
});
