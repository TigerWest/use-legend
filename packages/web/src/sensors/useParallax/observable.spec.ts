// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useParallax } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useParallax() — reactive options", () => {
  beforeEach(() => {
    if (!("DeviceOrientationEvent" in window)) {
      (window as any).DeviceOrientationEvent = class {};
    }
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
    it("accepts observable options without error", () => {
      const el = document.createElement("div");
      const tiltAdjust$ = observable((v: number) => v * 2);
      expect(() =>
        renderHook(() =>
          useParallax(wrapEl(el), {
            mouseTiltAdjust: tiltAdjust$,
            mouseRollAdjust: (v) => v * 3,
          })
        )
      ).not.toThrow();
    });

    it("per-field callback observable change does not crash", () => {
      const el = document.createElement("div");
      const rollAdjust$ = observable((v: number) => v * 2);
      const { result } = renderHook(() =>
        useParallax(wrapEl(el), {
          mouseRollAdjust: rollAdjust$,
        })
      );

      // Change callback
      expect(() => {
        rollAdjust$.set((v: number) => v * 5);
      }).not.toThrow();

      // Hook still returns valid observables
      expect(typeof result.current.roll$.get).toBe("function");
      expect(typeof result.current.tilt$.get).toBe("function");
    });
  });
});
