// @vitest-environment jsdom
import { useCallback } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useScope, toObs, onMount } from "@usels/core";
import { useOnLongPress } from ".";

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      Object.defineProperty(this, "pointerId", { value: init?.pointerId ?? 0, enumerable: true });
      Object.defineProperty(this, "width", { value: init?.width ?? 0, enumerable: true });
      Object.defineProperty(this, "height", { value: init?.height ?? 0, enumerable: true });
      Object.defineProperty(this, "pressure", { value: init?.pressure ?? 0, enumerable: true });
      Object.defineProperty(this, "tangentialPressure", {
        value: init?.tangentialPressure ?? 0,
        enumerable: true,
      });
      Object.defineProperty(this, "tiltX", { value: init?.tiltX ?? 0, enumerable: true });
      Object.defineProperty(this, "tiltY", { value: init?.tiltY ?? 0, enumerable: true });
      Object.defineProperty(this, "twist", { value: init?.twist ?? 0, enumerable: true });
      Object.defineProperty(this, "pointerType", {
        value: init?.pointerType ?? "mouse",
        enumerable: true,
      });
      Object.defineProperty(this, "isPrimary", {
        value: init?.isPrimary ?? false,
        enumerable: true,
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTarget() {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));
  return { div, target$, cleanup: () => document.body.removeChild(div) };
}

function firePointerDown(target: EventTarget, x = 0, y = 0) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: x, clientY: y })
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOnLongPress() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register event listeners on re-render", () => {
      const { div, target$, cleanup } = createTarget();
      const addSpy = vi.spyOn(div, "addEventListener");
      const handler = vi.fn();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useOnLongPress(target$, handler);
        },
        { initialProps: { count: 0 } }
      );

      const addCountAfterMount = addSpy.mock.calls.length;
      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
      cleanup();
    });

    it("does not restart pending timer on re-render", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useOnLongPress(target$, handler);
        },
        { initialProps: { count: 0 } }
      );

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      rerender({ count: 1 });
      act(() => {
        vi.advanceTimersByTime(200);
      }); // total 500ms

      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  describe("callback freshness", () => {
    it("handler uses latest closure after re-render", () => {
      const { div, target$, cleanup } = createTarget();
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const { rerender } = renderHook(
        (props: { handler: (e: PointerEvent) => void }) => useOnLongPress(target$, props.handler),
        { initialProps: { handler: cb1 } }
      );

      rerender({ handler: cb2 });

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  describe("stable return references", () => {
    it("stop function identity is stable across re-renders", () => {
      const { target$, cleanup } = createTarget();
      const handler = vi.fn();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useOnLongPress(target$, handler);
        },
        { initialProps: { count: 0 } }
      );

      const stop1 = result.current;
      rerender({ count: 1 });
      const stop2 = result.current;

      expect(stop1).toBe(stop2);
      cleanup();
    });
  });

  describe("toObs — cbs$ observable tracking", () => {
    it("cbs$ emits change when handler function reference changes", () => {
      const changeSpy = vi.fn();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }: { handler: (e: PointerEvent) => void }) =>
          useScope(
            (cbs) => {
              const cbs$ = toObs(cbs);
              onMount(() => (cbs$.handler as any).onChange(() => changeSpy()));
              return {};
            },
            { handler }
          ),
        { initialProps: { handler: handler1 } }
      );

      rerender({ handler: handler2 });
      expect(changeSpy).toHaveBeenCalledTimes(1);
    });

    it("cbs$ does not emit change when useCallback returns same handler reference", () => {
      const changeSpy = vi.fn();
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count;
          const stableHandler = useCallback(() => handler(), []);
          return useScope(
            (cbs) => {
              const cbs$ = toObs(cbs);
              onMount(() => (cbs$.handler as any).onChange(() => changeSpy()));
              return {};
            },
            { handler: stableHandler }
          );
        },
        { initialProps: { count: 0 } }
      );

      rerender({ count: 1 });
      rerender({ count: 2 });
      expect(changeSpy).not.toHaveBeenCalled();
    });
  });
});
