// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { observable, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";
import { useRef$ } from "@usels/core";
import type { MaybeElement } from "@usels/core";
import { useEventListener, type GeneralEventListener } from ".";

describe("useEventListener() — types", () => {
  // ---------------------------------------------------------------------------
  // return type
  // ---------------------------------------------------------------------------

  describe("return type", () => {
    it("returns a cleanup function () => void", () => {
      expectTypeOf<typeof useEventListener>()
        .returns.toEqualTypeOf<() => void>();
    });
  });

  // ---------------------------------------------------------------------------
  // generic inference
  // ---------------------------------------------------------------------------

  describe("generic inference", () => {
    it("infers event type from event name string for window events", () => {
      // The listener for "click" on window should receive MouseEvent
      type ClickListener = (ev: MouseEvent) => void;
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith("click", (_ev: MouseEvent) => {});
    });

    it("infers event type from event name string for keyboard events", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith("keydown", (_ev: KeyboardEvent) => {});
    });

    it("infers event type from event name string for HTMLElement events", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, "click", (_ev: MouseEvent) => {});
    });

    it("listener array type matches event type", () => {
      // Both listeners in array should accept the same event type
      const l1: GeneralEventListener<MouseEvent> = (_ev: MouseEvent) => {};
      const l2: GeneralEventListener<MouseEvent> = (_ev: MouseEvent) => {};
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith("click", [l1, l2]);
    });

    it("GeneralEventListener<E> is callable with event of type E", () => {
      expectTypeOf<GeneralEventListener<MouseEvent>>()
        .toBeCallableWith(new MouseEvent("click"));
    });
  });

  // ---------------------------------------------------------------------------
  // overloads
  // ---------------------------------------------------------------------------

  describe("overloads", () => {
    it("accepts Window target", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(window, "resize", (_ev: UIEvent) => {});
    });

    it("accepts Document target", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(document, "click", (_ev: MouseEvent) => {});
    });

    it("accepts HTMLElement target", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, "click", (_ev: MouseEvent) => {});
    });

    it("accepts SVGElement target", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(svg as any, "click", (_ev: Event) => {});
    });

    it("accepts null as target", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(null, "click", (_ev: Event) => {});
    });

    it("accepts undefined as target", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(undefined, "click", (_ev: Event) => {});
    });

    it("accepts Observable<OpaqueObject<Element>> target", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(
        ObservableHint.opaque(div)
      );
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(target$ as Observable<unknown>, "click", (_ev: Event) => {});
    });

    it("accepts Arrayable event — array of event names", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith("click", [(_ev: MouseEvent) => {}]);
    });

    it("accepts event name array (Arrayable<E>)", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, ["click", "mousedown"], (_ev: MouseEvent) => {});
    });

    it("accepts listener array (Arrayable<listener>)", () => {
      const div = document.createElement("div");
      const l1 = (_ev: MouseEvent) => {};
      const l2 = (_ev: MouseEvent) => {};
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, "click", [l1, l2]);
    });

    it("accepts AddEventListenerOptions as options", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, "click", (_ev: MouseEvent) => {}, { passive: true, capture: false });
    });

    it("accepts boolean capture option", () => {
      const div = document.createElement("div");
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith(div, "click", (_ev: MouseEvent) => {}, true);
    });

    it("accepts no-target overload with options", () => {
      expectTypeOf<typeof useEventListener>()
        .toBeCallableWith("click", (_ev: MouseEvent) => {}, { passive: true });
    });
  });
});
