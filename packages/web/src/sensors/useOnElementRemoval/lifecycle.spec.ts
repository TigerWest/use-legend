// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useRef$ } from "@usels/core";
import { useOnElementRemoval } from ".";

const waitForMutation = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

describe("useOnElementRemoval() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Ref$ target", () => {
    it("detects removal after Ref$ mount", async () => {
      const handler = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);

      const { result } = renderHook(() => {
        const ref = useRef$<HTMLDivElement>();
        useOnElementRemoval(ref, handler);
        return ref;
      });

      act(() => result.current(el as unknown as HTMLDivElement));
      await waitForMutation();

      act(() => document.body.removeChild(el));
      await waitForMutation();

      expect(handler).toHaveBeenCalledOnce();
    });

    it("detects removal again after remove → restore → remove cycle", async () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);

      const handler = vi.fn();

      const { result } = renderHook(() => {
        const ref = useRef$<HTMLDivElement>();
        useOnElementRemoval(ref, handler);
        return ref;
      });

      // Mount first element
      const el1 = document.createElement("div");
      parent.appendChild(el1);
      act(() => result.current(el1 as unknown as HTMLDivElement));
      await waitForMutation();

      // Remove first element
      act(() => parent.removeChild(el1));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(1);

      // Restore with new element
      const el2 = document.createElement("div");
      parent.appendChild(el2);
      act(() => result.current(el2 as unknown as HTMLDivElement));
      await waitForMutation();

      // Remove second element
      act(() => parent.removeChild(el2));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(2);

      document.body.removeChild(parent);
    });
  });

  describe("Observable target", () => {
    it("detects removal after Observable mount", async () => {
      const handler = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);

      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      act(() => target$.set(ObservableHint.opaque(el)));
      await waitForMutation();

      act(() => document.body.removeChild(el));
      await waitForMutation();

      expect(handler).toHaveBeenCalledOnce();
    });

    it("detects removal again after remove → restore → remove cycle", async () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);

      const handler = vi.fn();
      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      // Mount first element
      const el1 = document.createElement("div");
      parent.appendChild(el1);
      act(() => target$.set(ObservableHint.opaque(el1)));
      await waitForMutation();

      // Remove first element
      act(() => parent.removeChild(el1));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(1);

      // Restore with new element
      const el2 = document.createElement("div");
      parent.appendChild(el2);
      act(() => target$.set(ObservableHint.opaque(el2)));
      await waitForMutation();

      // Remove second element
      act(() => parent.removeChild(el2));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(2);

      document.body.removeChild(parent);
    });
  });

  describe("full cycle (null → element → null → element)", () => {
    it("does not call callback when element has not been removed from DOM", async () => {
      const handler = vi.fn();
      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      const el = document.createElement("div");
      document.body.appendChild(el);

      // null → element (Observable set, not DOM removal)
      act(() => target$.set(ObservableHint.opaque(el)));
      await waitForMutation();

      // element → null (Observable set to null, but el is still in DOM)
      act(() => target$.set(null));
      await waitForMutation();

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(el);
    });

    it("correctly detects removal across multiple cycles", async () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);

      const handler = vi.fn();
      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      for (let i = 0; i < 3; i++) {
        const el = document.createElement("div");
        parent.appendChild(el);

        act(() => target$.set(ObservableHint.opaque(el)));
        await waitForMutation();

        act(() => parent.removeChild(el));
        await waitForMutation();

        expect(handler).toHaveBeenCalledTimes(i + 1);

        act(() => target$.set(null));
        await waitForMutation();
      }

      document.body.removeChild(parent);
    });
  });
});
