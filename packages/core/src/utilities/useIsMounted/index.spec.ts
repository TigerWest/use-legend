// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useIsMounted } from ".";

describe("useIsMounted()", () => {
  it("returns a ReadonlyObservable-like object", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(typeof result.current.get).toBe("function");
    expect(typeof result.current.peek).toBe("function");
  });

  it("reads false during render (before onMount)", () => {
    let duringRender: unknown = "NOT_SET";
    renderHook(() => {
      const m$ = useIsMounted();
      duringRender = m$.peek();
      return m$;
    });
    expect(duringRender).toBe(false);
  });

  it("is true after mount", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current.get()).toBe(true);
  });

  it("stays true across re-renders", () => {
    const { result, rerender } = renderHook(() => useIsMounted());
    expect(result.current.get()).toBe(true);
    rerender();
    expect(result.current.get()).toBe(true);
  });
});
