// @vitest-environment jsdom
import { useState } from "react";
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

describe("usePointerSwipe() — rerender stability", () => {
  describe("stable references", () => {
    it("stop function is stable across re-renders", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => {
        const [, setState] = useState(0);
        return { ...usePointerSwipe(wrapEl(el)), triggerRerender: () => setState((v) => v + 1) };
      });

      const stop1 = result.current.stop;

      act(() => {
        result.current.triggerRerender();
      });

      expect(result.current.stop).toBe(stop1);
    });
  });
});
