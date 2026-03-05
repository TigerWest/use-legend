// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMutationObserver } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useMutationObserver() — element lifecycle", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("Observable target", () => {
    it("reacts to Observable<Element|null> target — starts observing after value is set", async () => {
      const callback = vi.fn();
      const target$ = observable<Element | null>(null);

      renderHook(() => useMutationObserver(target$ as any, callback, { attributes: true }));

      const el = document.createElement("div");
      document.body.appendChild(el);

      act(() => {
        target$.set(el);
      });

      await act(async () => {
        el.setAttribute("data-obs", "1");
        await flush();
      });

      expect(callback).toHaveBeenCalled();
      const records: MutationRecord[] = callback.mock.calls[0][0];
      expect(records[0].type).toBe("attributes");
    });

    it("Observable target element → null: MutationObserver is disconnected", async () => {
      const callback = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);
      const target$ = observable<Element | null>(el);

      renderHook(() => useMutationObserver(target$ as any, callback, { attributes: true }));

      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      act(() => {
        target$.set(null);
      });

      expect(disconnectSpy).toHaveBeenCalled();

      // Mutations on old element should not be reported
      await act(async () => {
        el.setAttribute("data-after-null", "1");
        await flush();
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Ref$ target", () => {
    it("reacts to Ref$ target — starts observing after element is assigned", async () => {
      const callback = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mo = useMutationObserver(el$ as any, callback, { attributes: true });
        return { el$, mo };
      });

      const div = document.createElement("div");
      document.body.appendChild(div);

      act(() => result.current.el$(div));

      await act(async () => {
        div.setAttribute("data-el", "1");
        await flush();
      });

      expect(callback).toHaveBeenCalled();
      const records: MutationRecord[] = callback.mock.calls[0][0];
      expect(records[0].type).toBe("attributes");
    });

    it("Ref$ target element → null: MutationObserver is disconnected", async () => {
      const callback = vi.fn();
      const div = document.createElement("div");
      document.body.appendChild(div);

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mo = useMutationObserver(el$ as any, callback, { attributes: true });
        return { el$, mo };
      });

      // Assign element first
      act(() => result.current.el$(div));

      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      // Remove element
      act(() => result.current.el$(null));

      expect(disconnectSpy).toHaveBeenCalled();

      // Mutations on old element should not be reported
      await act(async () => {
        div.setAttribute("data-after-null", "1");
        await flush();
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ target null → element → null → element: observer properly reconnected", async () => {
      const callback = vi.fn();

      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mo = useMutationObserver(el$ as any, callback, { attributes: true });
        return { el$, mo };
      });

      const div1 = document.createElement("div");
      const div2 = document.createElement("div");
      document.body.append(div1, div2);

      // null → element
      act(() => result.current.el$(div1));

      await act(async () => {
        div1.setAttribute("data-cycle-1", "1");
        await flush();
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // element → null
      act(() => result.current.el$(null));

      await act(async () => {
        div1.setAttribute("data-cycle-2", "1");
        await flush();
      });
      // callback should NOT have been called again
      expect(callback).toHaveBeenCalledTimes(1);

      // null → element (second element)
      act(() => result.current.el$(div2));

      await act(async () => {
        div2.setAttribute("data-cycle-3", "1");
        await flush();
      });
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("no MutationObserver leak after multiple target changes", async () => {
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

      const { result, unmount } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mo = useMutationObserver(el$ as any, vi.fn(), { attributes: true });
        return { el$, mo };
      });

      const elements = Array.from({ length: 4 }, () => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        return el;
      });

      // Cycle through 4 elements — each change disconnects the previous observer
      for (const el of elements) {
        act(() => result.current.el$(el));
      }

      const disconnectCallsBeforeUnmount = disconnectSpy.mock.calls.length;

      // Each target change (after the first) should have disconnected the previous observer.
      // We made 4 target assignments, so at least 3 disconnects should have occurred
      // (the first assignment creates an observer, each subsequent one disconnects it).
      expect(disconnectCallsBeforeUnmount).toBeGreaterThanOrEqual(3);

      // Unmount should disconnect the final observer
      unmount();
      await flush();

      expect(disconnectSpy.mock.calls.length).toBeGreaterThan(disconnectCallsBeforeUnmount);
    });
  });
});
