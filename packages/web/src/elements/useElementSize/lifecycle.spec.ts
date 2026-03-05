// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useElementSize } from ".";

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------

type BoxSize = { inlineSize: number; blockSize: number };

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];

  callback: ResizeObserverCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    ResizeObserverMock.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el);
  }

  disconnect() {
    this.disconnected = true;
    this.observed = [];
  }

  trigger(
    el: Element,
    options: {
      contentRect?: Partial<DOMRectReadOnly>;
      contentBoxSize?: BoxSize[];
      borderBoxSize?: BoxSize[];
      devicePixelContentBoxSize?: BoxSize[];
    } = {}
  ) {
    if (this.disconnected) return;
    const entry = {
      target: el,
      contentRect: {
        width: 100,
        height: 200,
        ...options.contentRect,
      } as DOMRectReadOnly,
      contentBoxSize: options.contentBoxSize ?? [],
      borderBoxSize: options.borderBoxSize ?? [],
      devicePixelContentBoxSize: options.devicePixelContentBoxSize ?? [],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this);
  }
}

beforeEach(() => {
  ResizeObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// useElementSize — element lifecycle
// ---------------------------------------------------------------------------

describe("useElementSize() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("sets offsetWidth/offsetHeight as initial size after element is assigned", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const size = useElementSize(el$);
        return { el$, size };
      });

      // Before assignment — initial values
      expect(result.current.size.width$.get()).toBe(0);
      expect(result.current.size.height$.get()).toBe(0);

      const div = document.createElement("div");
      Object.defineProperty(div, "offsetWidth", { value: 640, configurable: true });
      Object.defineProperty(div, "offsetHeight", { value: 480, configurable: true });

      act(() => result.current.el$(div));

      expect(result.current.size.width$.get()).toBe(640);
      expect(result.current.size.height$.get()).toBe(480);
    });

    it("resets to initialSize when target Ref$ becomes null", () => {
      const div = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const size = useElementSize(el$, { width: 5, height: 10 });
        return { el$, size };
      });

      // Assign element first
      act(() => result.current.el$(div));

      // Then set element to null (simulates unmounting)
      act(() => result.current.el$(null));

      expect(result.current.size.width$.get()).toBe(5);
      expect(result.current.size.height$.get()).toBe(10);
    });

    it("Ref$ target element → null: ResizeObserver is disconnected", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const size = useElementSize(el$);
        return { el$, size };
      });

      const div = document.createElement("div");
      act(() => result.current.el$(div));

      // Find the active observer
      const activeInstance = ResizeObserverMock.instances.find((i) => i.observed.includes(div));
      expect(activeInstance).toBeDefined();

      // Remove the element
      act(() => result.current.el$(null));

      // The observer that was watching div must now be disconnected
      expect(activeInstance!.disconnected).toBe(true);
    });
  });

  describe("Observable target", () => {
    it("Observable target element → null: ResizeObserver disconnected and size reset", () => {
      const div = document.createElement("div");
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() =>
        useElementSize(target$ as any, { width: 7, height: 14 })
      );

      // Observer should be active on div
      const activeInstance = ResizeObserverMock.instances.find((i) => i.observed.includes(div));
      expect(activeInstance).toBeDefined();

      // Trigger a resize to confirm it works
      act(() => activeInstance!.trigger(div, { contentRect: { width: 200, height: 100 } }));
      expect(result.current.width$.get()).toBe(200);

      // Remove the element
      act(() => target$.set(null));

      // Observer disconnected and size reset to initialSize
      expect(activeInstance!.disconnected).toBe(true);
      expect(result.current.width$.get()).toBe(7);
      expect(result.current.height$.get()).toBe(14);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: observer properly reconnected", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const size = useElementSize(el$);
        return { el$, size };
      });

      const div1 = document.createElement("div");
      const div2 = document.createElement("div");

      // null → element
      act(() => result.current.el$(div1));
      const instanceAfterFirstMount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div1)
      );
      expect(instanceAfterFirstMount).toBeDefined();

      // element → null
      act(() => result.current.el$(null));
      expect(instanceAfterFirstMount!.disconnected).toBe(true);

      // null → element (remount)
      act(() => result.current.el$(div2));
      const instanceAfterRemount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div2)
      );
      expect(instanceAfterRemount).toBeDefined();

      // Verify the remounted observer actually fires
      act(() =>
        instanceAfterRemount!.trigger(div2, { contentRect: { width: 400, height: 300 } })
      );
      expect(result.current.size.width$.get()).toBe(400);
      expect(result.current.size.height$.get()).toBe(300);
    });

    it("no ResizeObserver leak after multiple Ref$ null ↔ element cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const size = useElementSize(el$);
        return { el$, size };
      });

      const div = document.createElement("div");

      // Run 3 null ↔ element cycles
      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(div));
        act(() => result.current.el$(null));
      }

      // Every observer created (except potentially the last active one) must be disconnected
      const liveInstances = ResizeObserverMock.instances.filter((i) => !i.disconnected);
      // After ending on null, there should be no live observers with observed elements
      const liveObserving = liveInstances.filter((i) => i.observed.length > 0);
      expect(liveObserving).toHaveLength(0);

      // Total disconnected instances equals total created minus live ones — no dangling observers
      const disconnectedCount = ResizeObserverMock.instances.filter((i) => i.disconnected).length;
      expect(disconnectedCount).toBeGreaterThanOrEqual(3);
    });
  });
});
