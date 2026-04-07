// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScope, toObs } from ".";

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
});
