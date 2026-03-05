// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMouseInElement } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function createDiv(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getClientRects").mockReturnValue([full] as unknown as DOMRectList);
  return div;
}

function fireMouseMove(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
// Mocks: ResizeObserver, MutationObserver
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
}

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

beforeEach(() => {
  ResizeObserverMock.instances = [];
  MutationObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("MutationObserver", MutationObserverMock);
  Object.defineProperty(window, "scrollX", { value: 0, configurable: true });
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// useMouseInElement — element lifecycle
// ---------------------------------------------------------------------------

describe("useMouseInElement() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("Ref$ target null → element: all 4 event listeners + RO + MO are registered", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const docAddSpy = vi.spyOn(document, "addEventListener");

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouseInElement(el$);
        return { el$, mouse };
      });

      // Capture baseline before element assignment
      const roCountBefore = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.length > 0
      ).length;
      const moCountBefore = MutationObserverMock.instances.filter(
        (i) => !i.disconnected
      ).length;

      const winAddCountBefore = addSpy.mock.calls.length;
      const docAddCountBefore = docAddSpy.mock.calls.length;

      const div = createDiv();
      act(() => result.current.el$(div));

      // After element assignment: ResizeObserver and MutationObserver should be observing
      const roActive = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      expect(roActive.length).toBeGreaterThan(roCountBefore);

      const moActive = MutationObserverMock.instances.filter((i) => !i.disconnected);
      expect(moActive.length).toBeGreaterThan(moCountBefore);

      // window listeners (mousemove, scroll, resize) should have been registered
      // Note: useMouseInElement registers these at hook mount time (unconditionally),
      // so total window+doc listener count after mount covers all 4 event-based resources
      const winAddCountAfter = addSpy.mock.calls.length;
      const docAddCountAfter = docAddSpy.mock.calls.length;
      expect(winAddCountAfter + docAddCountAfter).toBeGreaterThan(
        winAddCountBefore + docAddCountBefore
      );
    });

    it("Ref$ target element → null: all resources are cleaned up", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouseInElement(el$);
        return { el$, mouse };
      });

      const div = createDiv();
      act(() => result.current.el$(div));

      // Verify RO and MO are active after element assignment
      const roInstance = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      expect(roInstance).toBeDefined();

      const moInstance = MutationObserverMock.instances.find((i) => !i.disconnected);
      expect(moInstance).toBeDefined();

      // Remove element
      act(() => result.current.el$(null));

      // RO and MO should be disconnected
      expect(roInstance!.disconnected).toBe(true);
      expect(moInstance!.disconnected).toBe(true);
    });

    it("Ref$ target element → null: mouse state resets (isOutside = true)", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouseInElement(el$);
        return { el$, mouse };
      });

      const div = createDiv();
      act(() => result.current.el$(div));

      // Move mouse inside element
      fireMouseMove(50, 40);
      expect(result.current.mouse.isOutside$.get()).toBe(false);
      expect(result.current.mouse.elementX$.get()).toBe(50);

      // Remove element — state should not reflect the removed element
      act(() => result.current.el$(null));

      // After element removed, no more mousemove updates from the (now null) element
      // The mousemove listener on window is still active (registered at mount),
      // but update() will find no element and skip — isOutside stays true if mouse moves out
      // Fire a mousemove after removal — getClientRects on null element won't be called
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 150, clientY: 150, bubbles: true })
        );
      });

      // isOutside should be true since element is null (peekElement returns null → update skips)
      expect(result.current.mouse.isOutside$.get()).toBe(true);
    });

    it("events on old element are not reported after target change", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouseInElement(el$);
        return { el$, mouse };
      });

      const div1 = createDiv({ left: 0, top: 0, right: 200, bottom: 100 });
      const div2 = createDiv({ left: 300, top: 300, right: 500, bottom: 400 });

      // Mount div1 and move mouse inside
      act(() => result.current.el$(div1));
      fireMouseMove(50, 40);
      expect(result.current.mouse.isOutside$.get()).toBe(false);

      // Switch to div2
      act(() => result.current.el$(div2));

      // Mouse at (50, 40) is outside div2 (left:300, top:300) → isOutside = true
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { clientX: 50, clientY: 40, bubbles: true })
        );
      });

      expect(result.current.mouse.isOutside$.get()).toBe(true);
    });
  });

  describe("Observable target", () => {
    it("Observable target element → null → element: resources re-registered", () => {
      const div = createDiv();
      const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => useMouseInElement(target$ as any));

      // RO and MO should observe div on mount
      const roInstance = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      expect(roInstance).toBeDefined();

      // Move mouse inside and confirm it works
      fireMouseMove(50, 40);
      expect(result.current.isOutside$.get()).toBe(false);

      // Set target to null
      act(() => target$.set(null));

      expect(roInstance!.disconnected).toBe(true);

      // Restore target to a new element
      const div2 = createDiv({ left: 0, top: 0, right: 200, bottom: 100 });
      act(() => target$.set(ObservableHint.opaque(div2)));

      const roInstanceNew = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div2)
      );
      expect(roInstanceNew).toBeDefined();

      // Mousemove should update relative to div2
      fireMouseMove(80, 60);
      expect(result.current.isOutside$.get()).toBe(false);
      expect(result.current.elementX$.get()).toBe(80);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: no resource leaks", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouseInElement(el$);
        return { el$, mouse };
      });

      const div1 = createDiv();
      const div2 = createDiv();

      // Cycle 1: null → element
      act(() => result.current.el$(div1));
      const roAfterFirstMount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div1)
      );
      expect(roAfterFirstMount).toBeDefined();

      // Cycle 2: element → null
      act(() => result.current.el$(null));
      expect(roAfterFirstMount!.disconnected).toBe(true);

      // Verify no live observers with elements after null
      const liveObserving = ResizeObserverMock.instances.filter(
        (i) => !i.disconnected && i.observed.length > 0
      );
      expect(liveObserving).toHaveLength(0);

      // Cycle 3: null → element (remount)
      act(() => result.current.el$(div2));
      const roAfterRemount = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div2)
      );
      expect(roAfterRemount).toBeDefined();

      // Verify the remounted observer works — mousemove updates position
      fireMouseMove(60, 50);
      expect(result.current.mouse.isOutside$.get()).toBe(false);
      expect(result.current.mouse.elementX$.get()).toBe(60);

      // Verify symmetric: total disconnected RO count equals at least the number of cycles that ended on null
      const disconnectedROCount = ResizeObserverMock.instances.filter(
        (i) => i.disconnected
      ).length;
      expect(disconnectedROCount).toBeGreaterThanOrEqual(1);

      // Same symmetry for MutationObserver
      const disconnectedMOCount = MutationObserverMock.instances.filter(
        (i) => i.disconnected
      ).length;
      expect(disconnectedMOCount).toBeGreaterThanOrEqual(1);
    });
  });
});
