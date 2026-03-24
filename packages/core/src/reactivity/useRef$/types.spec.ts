// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import type { Ref, RefObject } from "react";
import type { OpaqueObject } from "@legendapp/state";
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
  // overloads
  // -------------------------------------------------------------------------

  describe("overloads", () => {
    it("accepts callback ref as externalRef", () => {
      type CallbackRef = (node: Element | null) => void;
      expectTypeOf<typeof useRef$>().toBeCallableWith(undefined as unknown as CallbackRef);
    });

    it("accepts RefObject as externalRef", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>().toBeCallableWith(
        undefined as unknown as RefObject<HTMLDivElement | null>
      );
    });

    it("accepts null as externalRef (forwardRef null passthrough)", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>().toBeCallableWith(null);
    });

    it("accepts no argument (standalone useRef replacement)", () => {
      expectTypeOf<typeof useRef$>().toBeCallableWith();
    });

    it("externalRef parameter type accepts Ref<T> or null", () => {
      expectTypeOf<typeof useRef$<HTMLDivElement>>()
        .parameter(0)
        .toEqualTypeOf<Ref<HTMLDivElement> | null | undefined>();
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

    it("get() returns OpaqueObject<T> or null", () => {
      expectTypeOf<
        ReturnType<Ref$<HTMLDivElement>["get"]>
      >().toEqualTypeOf<OpaqueObject<HTMLDivElement> | null>();
    });

    it("peek() returns OpaqueObject<T> or null", () => {
      expectTypeOf<
        ReturnType<Ref$<HTMLDivElement>["peek"]>
      >().toEqualTypeOf<OpaqueObject<HTMLDivElement> | null>();
    });

    it("current is readonly and returns OpaqueObject<T> or null", () => {
      expectTypeOf<
        Ref$<HTMLDivElement>["current"]
      >().toEqualTypeOf<OpaqueObject<HTMLDivElement> | null>();
    });
  });
});
