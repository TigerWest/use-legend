// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import type { CreateProviderReturn, CreateProviderNullableReturn } from ".";
import { createProvider } from ".";

describe("createProvider() — types", () => {
  describe("return type", () => {
    it("strict mode: useContext returns Value (not Value | undefined)", () => {
      const [, useCtx] = createProvider((props: { x: number }) => props.x);
      expectTypeOf(useCtx).returns.toBeNumber();
    });

    it("non-strict mode: useContext returns Value | undefined", () => {
      const [, useCtx] = createProvider((props: { x: number }) => props.x, { strict: false });
      expectTypeOf(useCtx).returns.toEqualTypeOf<number | undefined>();
    });
  });

  describe("Provider props", () => {
    it("Provider accepts composable props + children", () => {
      const [Provider] = createProvider((props: { name: string; age: number }) => props);
      expectTypeOf(Provider).toBeCallableWith({
        name: "Alice",
        age: 30,
        children: null,
      });
    });
  });

  describe("overloads", () => {
    it("strict: true (or omitted) → CreateProviderReturn", () => {
      const result = createProvider((props: { x: number }) => props.x);
      expectTypeOf(result).toEqualTypeOf<CreateProviderReturn<{ x: number }, number>>();
    });

    it("strict: false → CreateProviderNullableReturn", () => {
      const result = createProvider((props: { x: number }) => props.x, { strict: false });
      expectTypeOf(result).toEqualTypeOf<CreateProviderNullableReturn<{ x: number }, number>>();
    });
  });

  describe("generic inference", () => {
    it("infers Value from composable return type", () => {
      const [, useCtx] = createProvider(() => ({ foo: "bar" }));
      expectTypeOf(useCtx).returns.toEqualTypeOf<{ foo: string }>();
    });

    it("infers Props from composable parameter type", () => {
      const [Provider] = createProvider((props: { label: string; count: number }) => props);
      expectTypeOf(Provider).parameter(0).toMatchTypeOf<{ label: string; count: number }>();
    });
  });

  describe("getHook (3rd tuple entry)", () => {
    it("strict mode: getHook returns Value", () => {
      const [, , getCtx] = createProvider((props: { x: number }) => props.x);
      expectTypeOf(getCtx).returns.toBeNumber();
    });

    it("non-strict mode: getHook returns Value | undefined", () => {
      const [, , getCtx] = createProvider((props: { x: number }) => props.x, { strict: false });
      expectTypeOf(getCtx).returns.toEqualTypeOf<number | undefined>();
    });
  });
});
