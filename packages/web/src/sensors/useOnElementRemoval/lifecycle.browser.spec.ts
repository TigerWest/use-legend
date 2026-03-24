/**
 * useOnElementRemoval — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real MutationObserver and no mocking.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useOnElementRemoval } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const waitForMutation = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useOnElementRemoval — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useOnElementRemoval() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ element removed from DOM: callback called", async () => {
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

    it("Ref$ element → null → new element → removal: callback called again", async () => {
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

      // Remove first element → callback fires
      act(() => parent.removeChild(el1));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(1);

      // Switch to new element
      const el2 = document.createElement("div");
      parent.appendChild(el2);
      act(() => result.current(el2 as unknown as HTMLDivElement));
      await waitForMutation();

      // Remove second element → callback fires again
      act(() => parent.removeChild(el2));
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(2);

      document.body.removeChild(parent);
    });

    it("Ref$ no callback when element is not removed from DOM", async () => {
      const handler = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);

      const { result } = renderHook(() => {
        const ref = useRef$<HTMLDivElement>();
        useOnElementRemoval(ref, handler);
        return ref;
      });

      // Mount via ref
      act(() => result.current(el as unknown as HTMLDivElement));
      await waitForMutation();

      // Set ref to null without removing from DOM
      act(() => result.current(null as unknown as HTMLDivElement));
      await waitForMutation();

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(el);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable null → element → DOM removal: callback called", async () => {
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

    it("Observable element → null: no callback when only observable set to null", async () => {
      const handler = vi.fn();
      const el = document.createElement("div");
      document.body.appendChild(el);

      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      act(() => target$.set(ObservableHint.opaque(el)));
      await waitForMutation();

      // Set observable to null — element still in DOM
      act(() => target$.set(null));
      await waitForMutation();

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(el);
    });

    it("Observable full cycle: callback called correctly across multiple cycles", async () => {
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

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("does not call callback when element has not been removed from DOM", async () => {
      const handler = vi.fn();
      const target$ = observable<OpaqueObject<Element> | null>(null);
      renderHook(() => useOnElementRemoval(target$, handler));

      const el = document.createElement("div");
      document.body.appendChild(el);

      act(() => target$.set(ObservableHint.opaque(el)));
      await waitForMutation();

      // Set observable to null — no DOM removal
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

    it("Ref$ full cycle: callback correctly fires after each removal", async () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);

      const handler = vi.fn();

      const { result } = renderHook(() => {
        const ref = useRef$<HTMLDivElement>();
        useOnElementRemoval(ref, handler);
        return ref;
      });

      for (let i = 0; i < 3; i++) {
        const el = document.createElement("div");
        parent.appendChild(el);

        act(() => result.current(el as unknown as HTMLDivElement));
        await waitForMutation();

        act(() => parent.removeChild(el));
        await waitForMutation();

        expect(handler).toHaveBeenCalledTimes(i + 1);
      }

      document.body.removeChild(parent);
    });
  });
});
