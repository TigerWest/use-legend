// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntersectionObserver } from ".";
import { useRef$ } from "@usels/core";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

const MockIntersectionObserver = vi.fn(function (
  cb: IntersectionObserverCallback,
  init?: IntersectionObserverInit
) {
  void cb;
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

describe("useIntersectionObserver() — element lifecycle", () => {
  describe("Ref$ target", () => {
    it("works with Ref$ target", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      // Before assignment — observe not yet called
      expect(mockObserve).not.toHaveBeenCalled();

      // Assign element via act after mount
      act(() => result.current.el$(div));

      // After assignment — observer must have been called with the element
      expect(mockObserve).toHaveBeenCalledWith(div);
      expect(result.current.io.isSupported$.get()).toBe(true);
    });

    it("delays setup until Ref$ root is mounted", () => {
      const el = document.createElement("div");
      const rootDiv = document.createElement("div");

      const { result } = renderHook(() => {
        const root$ = useRef$<HTMLElement>();
        return { root$, io: useIntersectionObserver(wrapEl(el), vi.fn(), { root: root$ }) };
      });

      // root Ref$ is null — observer must not be created yet
      expect(MockIntersectionObserver).not.toHaveBeenCalled();

      // assign the root element
      act(() => result.current.root$(rootDiv));

      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: rootDiv })
      );
    });

    it("reactively recreates observer when Ref$ root changes", () => {
      const el = document.createElement("div");
      const rootA = document.createElement("div");
      const rootB = document.createElement("div");

      const { result } = renderHook(() => {
        const root$ = useRef$<HTMLElement>();
        return { root$, io: useIntersectionObserver(wrapEl(el), vi.fn(), { root: root$ }) };
      });

      act(() => result.current.root$(rootA));
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => result.current.root$(rootB));

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ root: rootB })
      );
    });

    it("recreates observer when Ref$ target changes to a different element", () => {
      const elA = document.createElement("div");
      const elB = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      act(() => result.current.el$(elA));

      expect(mockObserve).toHaveBeenCalledWith(elA);
      mockObserve.mockClear();
      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      act(() => result.current.el$(elB));

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockObserve).toHaveBeenCalledWith(elB);
    });

    it("Ref$ target element → null: observer is disconnected", () => {
      const div = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      // Assign element
      act(() => result.current.el$(div));
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockObserve).toHaveBeenCalledWith(div);

      mockDisconnect.mockClear();

      // Remove element
      act(() => result.current.el$(null));

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: full lifecycle without leaks", () => {
      const div1 = document.createElement("div");
      const div2 = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      // null → element
      act(() => result.current.el$(div1));
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockObserve).toHaveBeenCalledWith(div1);

      // element → null
      mockDisconnect.mockClear();
      act(() => result.current.el$(null));
      expect(mockDisconnect).toHaveBeenCalledTimes(1);

      // null → element (different element)
      MockIntersectionObserver.mockClear();
      mockObserve.mockClear();
      act(() => result.current.el$(div2));
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(mockObserve).toHaveBeenCalledWith(div2);
    });

    it("pause state is preserved when target element transitions null → element", () => {
      const div = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      // Assign element and then pause
      act(() => result.current.el$(div));
      act(() => result.current.io.pause());

      expect(result.current.io.isActive$.get()).toBe(false);

      mockDisconnect.mockClear();
      MockIntersectionObserver.mockClear();

      // Remove element and re-add — pause state should be preserved (isActive$ still false)
      act(() => result.current.el$(null));
      act(() => result.current.el$(div));

      // Observer must NOT be recreated because isActive$ is still false
      expect(MockIntersectionObserver).not.toHaveBeenCalled();
      expect(result.current.io.isActive$.get()).toBe(false);
    });

    it("isActive$ reflects correct state after target element removal and re-addition", () => {
      const div = document.createElement("div");

      const { result } = renderHook(() => {
        const el$ = useRef$<Element>();
        return { el$, io: useIntersectionObserver(el$, vi.fn()) };
      });

      // null → element: isActive$ true, observer running
      act(() => result.current.el$(div));
      expect(result.current.io.isActive$.get()).toBe(true);

      // element → null: isActive$ still true (only disconnect, not pause)
      act(() => result.current.el$(null));
      expect(result.current.io.isActive$.get()).toBe(true);

      // null → element again: observer recreated, isActive$ still true
      MockIntersectionObserver.mockClear();
      act(() => result.current.el$(div));
      expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
      expect(result.current.io.isActive$.get()).toBe(true);
    });
  });
});
