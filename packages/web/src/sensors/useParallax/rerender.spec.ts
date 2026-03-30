// @vitest-environment jsdom
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useParallax } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useParallax() — rerender stability", () => {
  beforeEach(() => {
    if (!("DeviceOrientationEvent" in window)) {
      (window as any).DeviceOrientationEvent = class {};
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("value accuracy", () => {
    it("values remain accurate after re-render", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => {
        const [, setState] = useState(0);
        return { ...useParallax(wrapEl(el)), triggerRerender: () => setState((v) => v + 1) };
      });

      const rollBefore = result.current.roll$.get();
      const tiltBefore = result.current.tilt$.get();

      act(() => {
        result.current.triggerRerender();
      });

      expect(result.current.roll$.get()).toBe(rollBefore);
      expect(result.current.tilt$.get()).toBe(tiltBefore);
    });
  });
});
