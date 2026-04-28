import { describe, expect, it, vi } from "vitest";
import { observable } from "@legendapp/state";
import { createObserve, observe } from "./index";

describe("observe (deprecated alias)", () => {
  it("is the same function reference as createObserve", () => {
    expect(observe).toBe(createObserve);
  });

  it("still works at runtime when called outside a scope", () => {
    const val$ = observable(0);
    const spy = vi.fn();

    const dispose = observe(() => spy(val$.get()));
    val$.set(1);
    dispose();

    expect(spy).toHaveBeenCalledWith(0);
    expect(spy).toHaveBeenCalledWith(1);
  });
});
