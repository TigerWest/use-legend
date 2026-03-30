// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useSwipe() — rerender stability", () => {
  it("returns stable references across re-renders", () => {
    const div = document.createElement("div");
    const { result, rerender } = renderHook(() => useSwipe(wrapEl(div)));

    const first = result.current;
    rerender();

    expect(result.current.isSwiping$).toBe(first.isSwiping$);
    expect(result.current.direction$).toBe(first.direction$);
    expect(result.current.lengthX$).toBe(first.lengthX$);
    expect(result.current.lengthY$).toBe(first.lengthY$);
    expect(result.current.stop).toBe(first.stop);
  });
});
