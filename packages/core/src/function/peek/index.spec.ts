import { describe, it, expect, vi } from "vitest";
import { peek } from ".";
import { observable } from "@legendapp/state";

describe("peek() - single argument", () => {
  it("returns raw value as-is", () => {
    expect(peek("hello")).toBe("hello");
    expect(peek(42)).toBe(42);
    expect(peek(true)).toBe(true);
  });

  it("extracts value from Observable without tracking", () => {
    const obs$ = observable("world");
    expect(peek(obs$)).toBe("world");
  });

  it("handles null and undefined", () => {
    expect(peek(null)).toBe(null);
    expect(peek(undefined)).toBe(undefined);
    expect(peek(observable(null))).toBe(null);
    expect(peek(observable(undefined))).toBe(undefined);
  });

  it("handles objects", () => {
    const obj = { name: "John" };
    expect(peek(obj)).toEqual(obj);
    expect(peek(observable(obj))).toEqual(obj);
  });

  it("handles arrays", () => {
    const arr = [1, 2, 3];
    expect(peek(arr)).toEqual(arr);
    expect(peek(observable(arr))).toEqual(arr);
  });

  it("calls .peek() on Observable, not .get()", () => {
    const obs$ = observable("value");
    const getSpy = vi.spyOn(obs$, "get");
    const peekSpy = vi.spyOn(obs$, "peek");

    peek(obs$);

    expect(peekSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).not.toHaveBeenCalled();
  });
});

describe("peek() - two arguments (property access)", () => {
  it("extracts property from raw object", () => {
    const obj = { name: "John", age: 30 };
    expect(peek(obj, "name")).toBe("John");
    expect(peek(obj, "age")).toBe(30);
  });

  it("extracts property from Observable object", () => {
    const obs$ = observable({ name: "Jane", age: 25 });
    expect(peek(obs$, "name")).toBe("Jane");
    expect(peek(obs$, "age")).toBe(25);
  });

  it("reads current value non-reactively (two-arg form)", () => {
    // Verifies behavioral correctness: peek returns the correct value
    // without relying on spy internals (Legend-State object observables
    // expose .get/.peek through Proxy, not as own enumerable properties).
    const obs$ = observable({ initialValue: true, rootMargin: "0px" });
    expect(peek(obs$, "initialValue")).toBe(true);
    expect(peek(obs$, "rootMargin")).toBe("0px");
  });

  it("returns undefined for missing keys", () => {
    const obj = { name: "John" };
    expect(peek(obj, "age" as any)).toBe(undefined);
    expect(peek(observable(obj), "age" as any)).toBe(undefined);
  });

  it("handles null and undefined gracefully", () => {
    expect(peek(null, "key" as any)).toBe(undefined);
    expect(peek(undefined, "key" as any)).toBe(undefined);
    expect(peek(observable(null), "key" as any)).toBe(undefined);
  });

  it("preserves property value types", () => {
    const obj = {
      str: "text",
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      nested: { value: "deep" },
    };

    expect(peek(obj, "str")).toBe("text");
    expect(peek(obj, "num")).toBe(42);
    expect(peek(obj, "bool")).toBe(true);
    expect(peek(obj, "arr")).toEqual([1, 2, 3]);
    expect(peek(obj, "nested")).toEqual({ value: "deep" });
  });
});
