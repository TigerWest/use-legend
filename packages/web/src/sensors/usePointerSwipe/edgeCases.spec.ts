// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { usePointerSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

beforeEach(() => {
  if (!globalThis.PointerEvent) {
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        pointerId: number;
        pointerType: string;
        constructor(type: string, init: any = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
          this.pointerType = init.pointerType ?? "mouse";
        }
      }
    );
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function firePointerDown(target: EventTarget, x = 0, y = 0, opts: any = {}) {
  target.dispatchEvent(
    new PointerEvent("pointerdown", {
      clientX: x,
      clientY: y,
      buttons: 1,
      bubbles: true,
      ...opts,
    })
  );
}
function firePointerMove(target: EventTarget, x = 0, y = 0) {
  target.dispatchEvent(
    new PointerEvent("pointermove", { clientX: x, clientY: y, buttons: 1, bubbles: true })
  );
}
function firePointerUp(target: EventTarget, x = 0, y = 0) {
  target.dispatchEvent(
    new PointerEvent("pointerup", { clientX: x, clientY: y, buttons: 0, bubbles: true })
  );
}

describe("usePointerSwipe() — edge cases", () => {
  it("movement below threshold does not trigger swipe", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: 50 }));

    act(() => {
      firePointerDown(div, 0, 0);
      firePointerMove(div, 30, 0); // 30px < 50px threshold
    });

    expect(result.current.isSwiping$.get()).toBe(false);
    expect(result.current.direction$.get()).toBe("none");
  });

  it("stop() prevents further swipe detection", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: 10 }));

    act(() => {
      result.current.stop();
    });

    act(() => {
      firePointerDown(div, 0, 0);
      firePointerMove(div, 100, 0);
    });

    expect(result.current.isSwiping$.get()).toBe(false);
  });

  it("non-matching pointerType is ignored", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() =>
      usePointerSwipe(wrapEl(div), { threshold: 10, pointerTypes: ["touch"] })
    );

    act(() => {
      firePointerDown(div, 0, 0, { pointerType: "mouse" }); // not in pointerTypes
      firePointerMove(div, 100, 0);
    });

    expect(result.current.isSwiping$.get()).toBe(false);
  });

  it("element without setPointerCapture works fine", () => {
    const div = document.createElement("div");
    (div as any).setPointerCapture = undefined;
    const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: 10 }));

    act(() => {
      firePointerDown(div, 0, 0);
      firePointerMove(div, 100, 0);
    });

    expect(result.current.direction$.get()).toBe("right");
  });

  it("null target does not throw", () => {
    expect(() => renderHook(() => usePointerSwipe(null))).not.toThrow();
  });

  it("rapid consecutive swipes: state resets between swipes", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: 10 }));

    // First swipe: right
    act(() => {
      firePointerDown(div, 0, 0);
      firePointerMove(div, 100, 0);
    });
    expect(result.current.direction$.get()).toBe("right");

    act(() => {
      firePointerUp(div, 100, 0);
    });

    // Second swipe: left
    act(() => {
      firePointerDown(div, 100, 0);
      firePointerMove(div, 0, 0);
    });
    expect(result.current.direction$.get()).toBe("left");

    act(() => {
      firePointerUp(div, 0, 0);
    });

    expect(result.current.isSwiping$.get()).toBe(false);
  });
});
