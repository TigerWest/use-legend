// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expectTypeOf } from "vitest";
import { type Ref$, useRef$, createRef$ } from ".";

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

    it("generic T is inferred as HTMLDivElement | null when explicitly provided (no-arg overload)", () => {
      expectTypeOf<ReturnType<typeof useRef$<HTMLDivElement>>>().toEqualTypeOf<
        Ref$<HTMLDivElement | null>
      >();
    });

    it("generic T is inferred as HTMLButtonElement | null when explicitly provided (no-arg overload)", () => {
      expectTypeOf<ReturnType<typeof useRef$<HTMLButtonElement>>>().toEqualTypeOf<
        Ref$<HTMLButtonElement | null>
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

    it("Ref$ callable parameter is T | null", () => {
      expectTypeOf<Parameters<Ref$<HTMLDivElement>>[0]>().toEqualTypeOf<HTMLDivElement | null>();
    });
  });

  // -------------------------------------------------------------------------
  // return type — Ref$<T> is non-null (T carries nullability)
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

    it("get() returns T (non-null)", () => {
      expectTypeOf<ReturnType<Ref$<HTMLDivElement>["get"]>>().toEqualTypeOf<HTMLDivElement>();
    });

    it("peek() returns T (non-null)", () => {
      expectTypeOf<ReturnType<Ref$<HTMLDivElement>["peek"]>>().toEqualTypeOf<HTMLDivElement>();
    });

    it("current returns T (non-null)", () => {
      expectTypeOf<Ref$<HTMLDivElement>["current"]>().toEqualTypeOf<HTMLDivElement>();
    });
  });

  // -------------------------------------------------------------------------
  // non-null initialValue overload — createRef$(value) returns Ref$<T>
  // -------------------------------------------------------------------------

  describe("non-null initialValue overload", () => {
    it("current is T (non-null) when initialized with a non-null value", () => {
      expectTypeOf(createRef$(0).current).toEqualTypeOf<number>();
    });

    it("get() returns T (non-null) when initialized with a non-null value", () => {
      expectTypeOf(createRef$(0).get()).toEqualTypeOf<number>();
    });

    it("peek() returns T (non-null) when initialized with a non-null value", () => {
      expectTypeOf(createRef$(0).peek()).toEqualTypeOf<number>();
    });

    it("current is T (non-null) with element initialValue", () => {
      const div = document.createElement("div");
      expectTypeOf(createRef$(div).current).toEqualTypeOf<HTMLDivElement>();
    });

    it("set() still accepts T | null even with non-null init", () => {
      expectTypeOf(createRef$(0).set).parameter(0).toEqualTypeOf<number | null>();
    });

    it("useRef$ with non-null value: current is T (non-null)", () => {
      const { result } = renderHook(() => useRef$(0));
      expectTypeOf(result.current.current).toEqualTypeOf<number>();
    });
  });

  // -------------------------------------------------------------------------
  // null / no-arg overload — nullable via Ref$<T | null>
  // Nullability is expressed in the type parameter, not as a separate type.
  // The null-literal overload is declared first, so createRef$<T>(null) correctly
  // resolves to Ref$<T | null> (not the non-null overload).
  // -------------------------------------------------------------------------

  describe("null / no-arg overload — nullable via Ref$<T | null>", () => {
    it("Ref$<T | null> declares current as T | null", () => {
      expectTypeOf<Ref$<number | null>["current"]>().toEqualTypeOf<number | null>();
    });

    it("Ref$<T | null> declares get() as returning T | null", () => {
      expectTypeOf<ReturnType<Ref$<number | null>["get"]>>().toEqualTypeOf<number | null>();
    });

    it("Ref$<T | null> declares peek() as returning T | null", () => {
      expectTypeOf<ReturnType<Ref$<number | null>["peek"]>>().toEqualTypeOf<number | null>();
    });

    it("createRef$<number>(null) returns Ref$<number | null>", () => {
      expectTypeOf(createRef$<number>(null)).toEqualTypeOf<Ref$<number | null>>();
    });

    it("createRef$<number>() returns Ref$<number | null>", () => {
      expectTypeOf(createRef$<number>()).toEqualTypeOf<Ref$<number | null>>();
    });
  });
});
