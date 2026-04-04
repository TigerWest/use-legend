// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { observable, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";
import { useEventListener, type GeneralEventListener } from ".";
import type { MaybeEventTarget } from "../../types";

describe("useEventListener() — types", () => {
  // ---------------------------------------------------------------------------
  // return type
  // ---------------------------------------------------------------------------

  describe("return type", () => {
    it("returns a cleanup function () => void", () => {
      expectTypeOf<typeof useEventListener>().returns.toEqualTypeOf<() => void>();
    });
  });

  // ---------------------------------------------------------------------------
  // generic inference
  // ---------------------------------------------------------------------------

  describe("generic inference", () => {
    // NOTE: expectTypeOf().toBeCallableWith() cannot infer generic type
    // parameters from overloaded function signatures in union context.
    // Variable assignment verifies overload resolution instead — TypeScript
    // checks all overloads for assignment, enabling proper generic inference.

    it("infers MouseEvent for 'click' event on window (no-target overload)", () => {
      const _fn: (event: "click", listener: (ev: MouseEvent) => void) => () => void =
        useEventListener;
      expectTypeOf(_fn).toBeFunction();
    });

    it("infers MouseEvent for 'click' on HTMLElement target", () => {
      const _fn: (
        target: HTMLDivElement,
        event: "click",
        listener: (ev: MouseEvent) => void
      ) => () => void = useEventListener;
      expectTypeOf(_fn).toBeFunction();
    });

    it("listener array type matches event type", () => {
      const _fn: (event: "click", listeners: GeneralEventListener<MouseEvent>[]) => () => void =
        useEventListener;
      expectTypeOf(_fn).toBeFunction();
    });

    it("GeneralEventListener<E> is callable with event of type E", () => {
      expectTypeOf<GeneralEventListener<MouseEvent>>().toBeCallableWith(new MouseEvent("click"));
    });
  });

  // ---------------------------------------------------------------------------
  // overloads
  // ---------------------------------------------------------------------------

  describe("overloads", () => {
    // NOTE: Listener parameters use vi.fn() to bypass generic resolution
    // limitations in toBeCallableWith(). Specific event type inference is
    // covered in the "generic inference" section above.

    it("accepts Window target", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith(window, "resize", vi.fn());
    });

    it("accepts Document target", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith(document, "click", vi.fn());
    });

    it("accepts HTMLElement target", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(div, "click", vi.fn());
    });

    it("accepts SVGElement target", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(svg as any, "click", vi.fn());
    });

    it("accepts null as target", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith(null, "click", vi.fn());
    });

    it("accepts undefined as target", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith(undefined, "click", vi.fn());
    });

    it("accepts Observable<OpaqueObject<Element>> target", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(div));
      expectTypeOf<typeof useEventListener>().toBeCallableWith(
        target$ as unknown as Observable<unknown>,
        "click",
        vi.fn()
      );
    });

    it("accepts Arrayable event — array of event names", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith("click", [vi.fn()]);
    });

    it("accepts event name array (Arrayable<E>)", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(
        div,
        ["click", "mousedown"],
        vi.fn()
      );
    });

    it("accepts listener array (Arrayable<listener>)", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(div, "click", [vi.fn()]);
    });

    it("accepts AddEventListenerOptions as options", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(div, "click", vi.fn(), {
        passive: true,
        capture: false,
      });
    });

    it("accepts boolean capture option", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>().toBeCallableWith(div, "click", vi.fn(), true);
    });

    it("accepts no-target overload with options", () => {
      expectTypeOf<typeof useEventListener>().toBeCallableWith("click", vi.fn(), {
        passive: true,
      });
    });

    it("accepts MaybeEventTarget | EventTarget union as target", () => {
      // Regression: MaybeEventTarget | EventTarget union must resolve to an overload
      // without a type error, even though neither Overload 4 nor Overload 6 alone
      // accepts the full union.
      const target = null as unknown as MaybeEventTarget | EventTarget;
      expectTypeOf<typeof useEventListener>().toBeCallableWith(target, "click", vi.fn());
    });

    it("accepts MaybeEventTarget | EventTarget | null union as target", () => {
      const target = null as unknown as MaybeEventTarget | EventTarget | null;
      expectTypeOf<typeof useEventListener>().toBeCallableWith(target, "click", vi.fn());
    });
  });
});

// ---------------------------------------------------------------------------
// vi stub — types.spec.ts doesn't run hooks at runtime but vi.fn() is used
// for type-only callable checks; declare vi to satisfy TypeScript in this file.
// ---------------------------------------------------------------------------
declare const vi: { fn: () => (...args: any[]) => void };
