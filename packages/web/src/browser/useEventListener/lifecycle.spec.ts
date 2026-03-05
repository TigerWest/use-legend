// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useEventListener } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEventListener() — element lifecycle", () => {
  // ---------------------------------------------------------------------------
  // Ref$ target
  // ---------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("does not register listener before Ref$ is assigned", () => {
      const listener = vi.fn();
      renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      act(() => {
        window.dispatchEvent(new Event("click"));
      });
      expect(listener).not.toHaveBeenCalled();
    });

    it("starts listening after Ref$ receives an element", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");

      act(() => {
        result.current.el$(div);
      });

      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function), undefined);
    });

    it("invokes listener when event fires after Ref$ element is assigned", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });
      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      expect(listener).toHaveBeenCalledOnce();
    });

    it("removes listener from old element and registers on new element when Ref$ changes", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const elA = document.createElement("div");
      act(() => {
        result.current.el$(elA);
      });

      const removeSpyA = vi.spyOn(elA, "removeEventListener");
      const elB = document.createElement("div");
      const addSpyB = vi.spyOn(elB, "addEventListener");

      act(() => {
        result.current.el$(elB);
      });

      expect(removeSpyA).toHaveBeenCalledTimes(1);
      expect(addSpyB).toHaveBeenCalledTimes(1);
    });

    it("removes Ref$ listener on unmount", async () => {
      const listener = vi.fn();
      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });
      const removeSpy = vi.spyOn(div, "removeEventListener");

      unmount();
      await Promise.resolve();

      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it("removes listener when Ref$ target becomes null", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      act(() => {
        result.current.el$(div);
      });

      const removeSpy = vi.spyOn(div, "removeEventListener");

      // Set Ref$ to null — simulates conditional unmount
      act(() => {
        result.current.el$(null);
      });

      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it("addEventListener/removeEventListener call counts are symmetric after element → null", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");
      const removeSpy = vi.spyOn(div, "removeEventListener");

      act(() => {
        result.current.el$(div);
      });
      act(() => {
        result.current.el$(null);
      });

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });
  });

  // ---------------------------------------------------------------------------
  // Observable target
  // ---------------------------------------------------------------------------

  describe("Observable target", () => {
    it("starts listening after Observable target is set to an element", () => {
      const target$ = observable<Element | null>(null);
      const listener = vi.fn();

      renderHook(() => useEventListener(target$ as any, "click", listener));

      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");

      act(() => {
        target$.set(div);
      });

      expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function), undefined);
    });

    it("invokes listener when event fires after Observable target is set", () => {
      const target$ = observable<Element | null>(null);
      const listener = vi.fn();

      renderHook(() => useEventListener(target$ as any, "click", listener));

      const div = document.createElement("div");
      act(() => {
        target$.set(div);
      });
      act(() => {
        div.dispatchEvent(new Event("click"));
      });

      expect(listener).toHaveBeenCalledOnce();
    });

    it("Observable target element → null cleans up all listeners", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);
      const listener = vi.fn();

      renderHook(() => useEventListener(target$ as any, "click", listener));

      const div = document.createElement("div");
      act(() => {
        target$.set(ObservableHint.opaque(div));
      });

      const removeSpy = vi.spyOn(div, "removeEventListener");

      act(() => {
        target$.set(null);
      });

      expect(removeSpy).toHaveBeenCalledTimes(1);

      // listener should no longer be invoked
      act(() => {
        div.dispatchEvent(new Event("click"));
      });
      expect(listener).toHaveBeenCalledOnce(); // only the call before null
    });
  });

  // ---------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // ---------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple null ↔ element cycles", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const div = document.createElement("div");
      const addSpy = vi.spyOn(div, "addEventListener");
      const removeSpy = vi.spyOn(div, "removeEventListener");

      // Cycle 1: mount → unmount
      act(() => { result.current.el$(div); });
      act(() => { result.current.el$(null); });

      // Cycle 2: mount → unmount
      act(() => { result.current.el$(div); });
      act(() => { result.current.el$(null); });

      // Cycle 3: mount
      act(() => { result.current.el$(div); });

      // After 3 mounts and 2 unmounts, add should be called 3 times, remove 2 times
      expect(addSpy.mock.calls.length).toBe(3);
      expect(removeSpy.mock.calls.length).toBe(2);

      // After final unmount, they should be symmetric
      act(() => { result.current.el$(null); });
      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("listener is not invoked for events on old element after Ref$ switches", () => {
      const listener = vi.fn();
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        useEventListener(el$ as any, "click", listener);
        return { el$ };
      });

      const elA = document.createElement("div");
      const elB = document.createElement("div");

      act(() => { result.current.el$(elA); });
      // Switch to elB — elA should no longer trigger listener
      act(() => { result.current.el$(elB); });

      listener.mockClear();

      act(() => {
        elA.dispatchEvent(new Event("click"));
      });

      expect(listener).not.toHaveBeenCalled();

      act(() => {
        elB.dispatchEvent(new Event("click"));
      });

      expect(listener).toHaveBeenCalledOnce();
    });
  });
});
