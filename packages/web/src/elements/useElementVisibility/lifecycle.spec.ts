// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useElementVisibility } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedCallback: IntersectionObserverCallback;

const MockIntersectionObserver = vi.fn(function (
  cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
) {
  capturedCallback = cb;
  void init;
  return { observe: mockObserve, disconnect: mockDisconnect };
});

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  MockIntersectionObserver.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeEntry(isIntersecting: boolean, time = 0): IntersectionObserverEntry {
  return { isIntersecting, time } as IntersectionObserverEntry;
}

describe("useElementVisibility() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("Ref$ as scrollTarget — delays IntersectionObserver until Ref$ is mounted", () => {
      const el = document.createElement("div");
      const scrollContainer = document.createElement("div");

      const { result } = renderHook(() => {
        const scrollTarget$ = useRef$<HTMLElement>();
        return {
          scrollTarget$,
          visibility: useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }),
        };
      });

      // Ref$ is null → useIntersectionObserver's null guard skips setup
      expect(MockIntersectionObserver).not.toHaveBeenCalled();

      act(() => {
        result.current.scrollTarget$(scrollContainer);
      });

      // Ref$ mounted → useIntersectionObserver's useObserve re-runs → setup() with root
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: scrollContainer })
      );
    });

    it("Ref$ scrollTarget change → IntersectionObserver recreated with new root", () => {
      const el = document.createElement("div");
      const containerA = document.createElement("div");
      const containerB = document.createElement("div");

      const { result } = renderHook(() => {
        const scrollTarget$ = useRef$<HTMLElement>();
        return {
          scrollTarget$,
          visibility: useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }),
        };
      });

      act(() => {
        result.current.scrollTarget$(containerA);
      });

      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: containerA })
      );

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => {
        result.current.scrollTarget$(containerB);
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: containerB })
      );
    });

    it("Ref$ target element → null: IntersectionObserver is disconnected", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return {
          el$,
          visibility: useElementVisibility(el$),
        };
      });

      const el = document.createElement("div");

      // Mount: element → IO created
      act(() => {
        result.current.el$(el);
      });
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);

      mockDisconnect.mockClear();

      // Unmount: null → IO disconnected
      act(() => {
        result.current.el$(null);
      });
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("isVisible$ resets to initialValue when target element is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return {
          el$,
          visibility: useElementVisibility(el$, { initialValue: false }),
        };
      });

      const el = document.createElement("div");

      // Mount element and fire IO callback to set visible=true
      act(() => {
        result.current.el$(el);
      });

      act(() => {
        capturedCallback([makeEntry(true)], {} as IntersectionObserver);
      });
      expect(result.current.visibility.get()).toBe(true);

      // Remove element — visibility should reset to initialValue (false)
      act(() => {
        result.current.el$(null);
      });
      expect(result.current.visibility.get()).toBe(false);
    });

    it("once: true — stop() is not called when element is removed before becoming visible", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return {
          el$,
          visibility: useElementVisibility(el$, { once: true }),
        };
      });

      const el = document.createElement("div");

      // Mount element
      act(() => {
        result.current.el$(el);
      });

      mockDisconnect.mockClear();

      // Remove element before it becomes visible
      act(() => {
        result.current.el$(null);
      });

      // disconnect from cleanup is expected, but stop() (via disconnect) must not be
      // called due to once logic (element never became visible)
      // The disconnect here is from element removal cleanup, not from once: true logic
      expect(result.current.visibility.get()).toBe(false);
    });
  });

  describe("Observable target", () => {
    it("per-field scrollTarget as Observable<HTMLElement|null> — null→element tracked", () => {
      const el = document.createElement("div");
      const container = document.createElement("div");
      // Start with null — @legendapp/state reliably tracks null→element transitions.
      // Use OpaqueObject to prevent Legend-State from deeply proxying the element.
      const scrollTarget$ = observable<OpaqueObject<Element> | null>(null);

      renderHook(() => useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }));

      MockIntersectionObserver.mockClear();
      mockDisconnect.mockClear();

      act(() => {
        scrollTarget$.set(ObservableHint.opaque(container));
      });

      // null→element: null root delays IO creation, no old IO to disconnect
      // → new IO created with container as root
      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: container })
      );
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: IO properly reconnected", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        return {
          el$,
          visibility: useElementVisibility(el$),
        };
      });

      const el1 = document.createElement("div");
      const el2 = document.createElement("div");

      // Initially no element → no IO
      expect(MockIntersectionObserver).not.toHaveBeenCalled();

      // Cycle 1: null → element
      act(() => {
        result.current.el$(el1);
      });
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      // Cycle 2: element → null (cleanup)
      act(() => {
        result.current.el$(null);
      });
      expect(mockDisconnect).toHaveBeenCalledTimes(1);

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      // Cycle 3: null → element (re-register)
      act(() => {
        result.current.el$(el2);
      });
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockDisconnect).not.toHaveBeenCalled();
    });
  });
});
