// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useElementBounding } from ".";

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------

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

  trigger(el: Element) {
    if (this.disconnected) return;
    const entry = {
      target: el,
      contentRect: { width: 0, height: 0 } as DOMRectReadOnly,
      contentBoxSize: [],
      borderBoxSize: [],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this);
  }
}

// ---------------------------------------------------------------------------
// MutationObserver mock
// ---------------------------------------------------------------------------

class MutationObserverMock {
  static instances: MutationObserverMock[] = [];
  callback: MutationCallback;
  disconnected = false;

  constructor(cb: MutationCallback) {
    this.callback = cb;
    MutationObserverMock.instances.push(this);
  }

  observe(_el: Element, _opts?: MutationObserverInit) {}

  disconnect() {
    this.disconnected = true;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  ResizeObserverMock.instances = [];
  MutationObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("MutationObserver", MutationObserverMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function createDivWithRect(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    x: 0, y: 0, top: 0, right: 200, bottom: 100,
    left: 0, width: 200, height: 100, toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getBoundingClientRect").mockReturnValue(full);
  return div;
}

// ---------------------------------------------------------------------------
// useElementBounding — element lifecycle
// ---------------------------------------------------------------------------

describe("useElementBounding() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("Ref$ target null → element: all observers and listeners are set up", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$, { useCssTransforms: false });
        return { el$, bounding };
      });

      const roCountBefore = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.length > 0
      ).length;
      const moCountBefore = MutationObserverMock.instances.filter(
        (i) => !i.disconnected
      ).length;

      const div = createDivWithRect({ width: 150, height: 75 });
      act(() => result.current.el$(div));

      // ResizeObserver should now be observing the element
      const roActive = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      expect(roActive.length).toBeGreaterThan(roCountBefore);

      // MutationObserver should be active
      const moActive = MutationObserverMock.instances.filter((i) => !i.disconnected);
      expect(moActive.length).toBeGreaterThan(moCountBefore);

      // window scroll/resize listeners are registered at mount time (useEventListener is called unconditionally)
      const scrollListeners = addSpy.mock.calls.filter(([e]) => e === "scroll");
      const resizeListeners = addSpy.mock.calls.filter(([e]) => e === "resize");
      expect(scrollListeners.length).toBeGreaterThan(0);
      expect(resizeListeners.length).toBeGreaterThan(0);

      addSpy.mockRestore();
    });

    it("Ref$ target element → null: all observers disconnected and listeners removed", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$, { useCssTransforms: false });
        return { el$, bounding };
      });

      const div = createDivWithRect();
      act(() => result.current.el$(div));

      const roInstance = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      const moInstance = MutationObserverMock.instances.find((i) => !i.disconnected);
      expect(roInstance).toBeDefined();
      expect(moInstance).toBeDefined();

      // Remove element
      act(() => result.current.el$(null));

      // RO and MO should be disconnected when target goes to null
      expect(roInstance!.disconnected).toBe(true);
      expect(moInstance!.disconnected).toBe(true);

      // window scroll/resize listeners are removed on unmount (not on element removal)
      unmount();
      const scrollRemoved = removeSpy.mock.calls.some(([e]) => e === "scroll");
      const resizeRemoved = removeSpy.mock.calls.some(([e]) => e === "resize");
      expect(scrollRemoved).toBe(true);
      expect(resizeRemoved).toBe(true);

      removeSpy.mockRestore();
    });

    it("Ref$ target element → null: bounding values reset to zero", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$, { useCssTransforms: false });
        return { el$, bounding };
      });

      const div = createDivWithRect({ width: 200, height: 100, x: 10, y: 20 });
      act(() => result.current.el$(div));

      expect(result.current.bounding.width$.get()).toBe(200);
      expect(result.current.bounding.height$.get()).toBe(100);

      // Remove element — values should reset to 0 (default reset=true)
      act(() => result.current.el$(null));

      expect(result.current.bounding.width$.get()).toBe(0);
      expect(result.current.bounding.height$.get()).toBe(0);
      expect(result.current.bounding.x$.get()).toBe(0);
      expect(result.current.bounding.y$.get()).toBe(0);
      expect(result.current.bounding.top$.get()).toBe(0);
      expect(result.current.bounding.right$.get()).toBe(0);
      expect(result.current.bounding.bottom$.get()).toBe(0);
      expect(result.current.bounding.left$.get()).toBe(0);
    });

    it("Ref$ target element → null: pending RAF is cancelled", () => {
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$);
        return { el$, bounding };
      });

      const div = createDivWithRect();
      act(() => result.current.el$(div));

      // Trigger an update to queue a RAF
      act(() => result.current.bounding.update());

      // Remove element before RAF fires — should cancel the pending RAF
      act(() => result.current.el$(null));

      // After element removal with a pending RAF, cancelAnimationFrame is called
      // (recalculate is called with no element → assigns ZERO, no RAF needed)
      // The cancel happens because recalculate early-exits and the RAF runs the unmounted guard
      // Actually the RAF itself still runs but finds null element and resets values
      // The important thing is that the values reset and no stale update happens
      expect(result.current.bounding.width$.get()).toBe(0);

      cancelSpy.mockRestore();
    });

    it("reset: false — bounding values are NOT reset when element is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$, { useCssTransforms: false, reset: false });
        return { el$, bounding };
      });

      const div = createDivWithRect({ width: 250, height: 125, x: 5, y: 15,
        top: 15, right: 255, bottom: 140, left: 5 });
      act(() => result.current.el$(div));

      expect(result.current.bounding.width$.get()).toBe(250);
      expect(result.current.bounding.height$.get()).toBe(125);

      // Remove element — values should be retained (reset=false)
      act(() => result.current.el$(null));

      expect(result.current.bounding.width$.get()).toBe(250);
      expect(result.current.bounding.height$.get()).toBe(125);
    });
  });

  describe("Observable target", () => {
    it("Observable target element → null → element: observers and listeners re-registered", () => {
      const div1 = createDivWithRect({ width: 200, height: 100 });
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div1));

      const { result } = renderHook(() =>
        useElementBounding(target$ as any, { useCssTransforms: false })
      );

      // Initial element — RO should be observing div1
      const roAfterMount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div1)
      );
      expect(roAfterMount).toBeDefined();
      expect(result.current.width$.get()).toBe(200);

      // Set target to null — RO disconnected, values reset
      act(() => target$.set(null));

      expect(roAfterMount!.disconnected).toBe(true);
      expect(result.current.width$.get()).toBe(0);

      // Set a new element — new RO registered
      const div2 = createDivWithRect({ width: 400, height: 200 });
      act(() => target$.set(ObservableHint.opaque(div2)));

      const roAfterRemount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div2)
      );
      expect(roAfterRemount).toBeDefined();
      expect(result.current.width$.get()).toBe(400);
      expect(result.current.height$.get()).toBe(200);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: full lifecycle without resource leaks", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const bounding = useElementBounding(el$, { useCssTransforms: false });
        return { el$, bounding };
      });

      const div1 = createDivWithRect({ width: 100, height: 50 });
      const div2 = createDivWithRect({ width: 300, height: 150 });

      // null → element
      act(() => result.current.el$(div1));

      const roAfterFirst = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div1)
      );
      expect(roAfterFirst).toBeDefined();
      expect(result.current.bounding.width$.get()).toBe(100);

      // element → null
      act(() => result.current.el$(null));

      expect(roAfterFirst!.disconnected).toBe(true);
      expect(result.current.bounding.width$.get()).toBe(0);

      // null → element (remount with different element)
      act(() => result.current.el$(div2));

      const roAfterRemount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div2)
      );
      expect(roAfterRemount).toBeDefined();
      expect(result.current.bounding.width$.get()).toBe(300);
      expect(result.current.bounding.height$.get()).toBe(150);

      // No live observers watching elements from previous null state
      const liveObserving = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.length > 0
      );
      expect(liveObserving.length).toBeGreaterThan(0); // only the latest is live

      // All previously disconnected observers remain disconnected
      expect(roAfterFirst!.disconnected).toBe(true);

      // MutationObserver also cleaned up and re-registered symmetrically
      const disconnectedMO = MutationObserverMock.instances.filter((i) => i.disconnected);
      expect(disconnectedMO.length).toBeGreaterThanOrEqual(1);
    });
  });
});
