// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useRef$, type Ref$ } from "@usels/core";
import { createOpaque } from "@usels/core/reactivity/useOpaque/core";
import type { MaybeEventTarget } from "../../types";
import { normalizeTargets } from ".";

const wrapEl = (el: Element): MaybeEventTarget =>
  createOpaque<Element>(el) as unknown as MaybeEventTarget;

describe("normalizeTargets()", () => {
  it("returns empty array for null plain value", () => {
    expect(normalizeTargets(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeTargets(undefined)).toEqual([]);
  });

  it("returns empty array for empty array input", () => {
    expect(normalizeTargets([])).toEqual([]);
  });

  it("returns element for Observable<OpaqueObject<Element>> input", () => {
    const div = document.createElement("div");
    expect(normalizeTargets(wrapEl(div))).toEqual([div]);
  });

  it("returns elements for array of Observable<OpaqueObject<Element>>", () => {
    const a = document.createElement("div");
    const b = document.createElement("span");
    expect(normalizeTargets([wrapEl(a), wrapEl(b)])).toEqual([a, b]);
  });

  it("unwraps Observable<OpaqueObject<Element>>", () => {
    const div = document.createElement("div");
    expect(normalizeTargets(wrapEl(div))).toEqual([div]);
  });

  it("filters out Observable<null>", () => {
    const obs$ = createOpaque<Element>();
    expect(normalizeTargets(obs$)).toEqual([]);
  });

  it("unwraps Ref$ target and returns the raw DOM element", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => useRef$<HTMLDivElement>());

    act(() => result.current(div));

    const elements = normalizeTargets(result.current as Ref$<Element>);
    expect(elements).toEqual([div]);
  });

  it("returns empty array when Ref$ has no element assigned", () => {
    const { result } = renderHook(() => useRef$<HTMLDivElement>());

    const elements = normalizeTargets(result.current as Ref$<Element>);
    expect(elements).toEqual([]);
  });

  it("handles mixed array of Ref$, Observable, and wrapped Element", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    const p = document.createElement("p");

    const { result } = renderHook(() => useRef$<HTMLDivElement>());
    act(() => result.current(div));

    const obs = wrapEl(span);

    const elements = normalizeTargets([result.current, obs, wrapEl(p)]);
    expect(elements).toEqual([div, span, p]);
  });

  it("passes through Document as-is", () => {
    expect(normalizeTargets(document)).toEqual([document]);
  });

  it("passes through Window as-is", () => {
    expect(normalizeTargets(window)).toEqual([window]);
  });
});
