// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useParentElement } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const attached: Element[] = [];

/** Attach a child inside a parent div to the document and track for cleanup. */
function attachToBody<T extends Element>(child: T): { child: T; parent: HTMLDivElement } {
  const parent = document.createElement("div");
  parent.appendChild(child);
  document.body.appendChild(parent);
  attached.push(parent);
  return { child, parent };
}

afterEach(() => {
  attached.forEach((el) => el.parentNode?.removeChild(el));
  attached.length = 0;
});

// ---------------------------------------------------------------------------
// useParentElement()
// ---------------------------------------------------------------------------

describe("useParentElement()", () => {
  it("returns parentElement of a plain element attached to DOM", () => {
    const child = document.createElement("span");
    const { parent } = attachToBody(child);

    const { result } = renderHook(() => useParentElement(wrapEl(child)));

    expect(result.current.get()).toBe(parent);
  });

  it("returns null when element is not attached to DOM", () => {
    const el = document.createElement("div");
    // not appended anywhere

    const { result } = renderHook(() => useParentElement(wrapEl(el)));

    expect(result.current.get()).toBeNull();
  });

  it("returns null when element param is undefined", () => {
    const { result } = renderHook(() => useParentElement());

    expect(result.current.get()).toBeNull();
  });

  it("updates when Ref$ is reassigned to a different element", () => {
    const childA = document.createElement("span");
    const { parent: parentA } = attachToBody(childA);

    const childB = document.createElement("em");
    const { parent: parentB } = attachToBody(childB);

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLElement>();
      return { el$, parent$: useParentElement(el$) };
    });

    act(() => result.current.el$(childA));
    expect(result.current.parent$.get()).toBe(parentA);

    act(() => result.current.el$(childB));
    expect(result.current.parent$.get()).toBe(parentB);
  });

  it("observable value persists after unmount", () => {
    const child = document.createElement("span");
    attachToBody(child);

    const { result, unmount } = renderHook(() => useParentElement(wrapEl(child)));

    expect(result.current.get()).not.toBeNull();
    unmount();
    // Observable value remains readable after unmount
    expect(result.current.get()).not.toBeNull();
  });

  it("returns null when Document is passed", () => {
    const { result } = renderHook(() => useParentElement(document as any));
    expect(result.current.get()).toBeNull();
  });

  it("does NOT update when element's Observable value is unchanged (only DOM moved)", () => {
    const child = document.createElement("span");
    const { parent: parentA } = attachToBody(child);

    const { result } = renderHook(() => useParentElement(wrapEl(child)));
    expect(result.current.get()).toBe(parentA);

    const parentB = document.createElement("div");
    document.body.appendChild(parentB);
    attached.push(parentB);
    parentB.appendChild(child);

    // plain element는 Observable이 아니므로 갱신되지 않음
    expect(result.current.get()).toBe(parentA);
  });

  it("returns parent of an SVGElement", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.appendChild(circle);
    document.body.appendChild(svg);
    attached.push(svg);

    const { result } = renderHook(() => useParentElement(circle as any));
    expect(result.current.get()).toBe(svg);
  });
});
