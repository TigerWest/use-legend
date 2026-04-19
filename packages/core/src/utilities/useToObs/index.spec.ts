// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { isObservable, observable, observe, ObservableHint } from "@legendapp/state";
import { useState } from "react";
import { useToObs } from ".";

interface SimpleOpts {
  val: string;
}

// =============================================================================
// No transform
// =============================================================================

describe("useToObs() — no transform", () => {
  it("undefined options → Observable<undefined>", () => {
    const { result } = renderHook(() => useToObs(undefined));
    expect(isObservable(result.current)).toBe(true);
    expect(result.current.get()).toBeUndefined();
  });

  it("plain object → fields readable via .get()", () => {
    const { result } = renderHook(() => useToObs<{ x: number; y: number }>({ x: 10, y: 20 }));
    expect(result.current.x.get()).toBe(10);
    expect(result.current.y.get()).toBe(20);
  });

  it("per-field Observable → auto-deref, reactive", () => {
    const val$ = observable("hello");
    const opts = { val: val$ }; // stable reference
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts));
    expect(result.current.val.get()).toBe("hello");
    act(() => {
      val$.set("world");
    });
    expect(result.current.val.get()).toBe("world");
  });

  it("outer Observable → reacts to whole-object replace", () => {
    const options$ = observable<SimpleOpts>({ val: "a" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(options$));
    expect(result.current.val.get()).toBe("a");
    act(() => {
      options$.set({ val: "b" });
    });
    expect(result.current.val.get()).toBe("b");
  });

  it("outer Observable child-field mutation → opts$ recomputes (get() dep on options$ catches child notifications)", () => {
    const options$ = observable<SimpleOpts>({ val: "a" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(options$));
    act(() => {
      options$.val.set("b");
    });
    expect(result.current.val.get()).toBe("b");
  });

  it("returns an Observable", () => {
    const { result } = renderHook(() => useToObs<SimpleOpts>({ val: "x" }));
    expect(isObservable(result.current)).toBe(true);
  });
});

// =============================================================================
// Function-form transform
// =============================================================================

describe("useToObs() — function-form transform", () => {
  it("custom compute fn is called, its return value is what opts$ resolves to", () => {
    const compute = vi.fn((_raw) => ({ val: "computed" }));
    const { result } = renderHook(() => useToObs<SimpleOpts>({ val: "ignored" }, compute));
    expect(result.current.val.get()).toBe("computed");
    expect(compute).toHaveBeenCalled();
  });

  it("compute fn receives optionsRef.current (the raw options)", () => {
    const rawOpts = { val: "raw" };
    let captured: unknown;
    const { result } = renderHook(() =>
      useToObs<SimpleOpts>(rawOpts, (raw) => {
        captured = raw;
        return { val: "x" };
      })
    );
    result.current.get();
    expect(captured).toBe(rawOpts);
  });

  it("compute fn can register reactive deps via get() on outer Observable", () => {
    const options$ = observable<SimpleOpts>({ val: "a" });
    const { result } = renderHook(() =>
      useToObs<SimpleOpts>(options$, (raw) => {
        const v = isObservable(raw)
          ? (raw as typeof options$).get()
          : (raw as SimpleOpts | undefined);
        return v ? { val: v.val + "!" } : undefined;
      })
    );
    expect(result.current.val.get()).toBe("a!");
    act(() => {
      options$.set({ val: "b" });
    });
    expect(result.current.val.get()).toBe("b!");
  });

  it("plain options reference change (new depKey Symbol) → compute re-evaluated", () => {
    let evalCount = 0;
    const { result, rerender } = renderHook(
      ({ opts }: { opts: SimpleOpts }) =>
        useToObs<SimpleOpts>(opts, () => {
          evalCount++;
          return undefined;
        }),
      { initialProps: { opts: { val: "a" } } }
    );
    result.current.get();
    const after1 = evalCount;
    rerender({ opts: { val: "b" } });
    result.current.get();
    expect(evalCount).toBeGreaterThan(after1);
  });
});

// =============================================================================
// Object-form: 'default' hint
// =============================================================================

describe("useToObs() — object-form: 'default' (explicit or omitted)", () => {
  it("explicit 'default' → per-field Observable is reactive via Legend-State auto-deref", () => {
    const val$ = observable("initial");
    const opts = { val: val$ };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { val: "default" }));
    act(() => {
      val$.set("updated");
    });
    expect(result.current.val.get()).toBe("updated");
  });

  it("omitted field defaults to 'default' → reactive", () => {
    const val$ = observable("initial");
    const opts = { val: val$ };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, {}));
    act(() => {
      val$.set("updated");
    });
    expect(result.current.val.get()).toBe("updated");
  });

  it("resolves per-field Observable to its current value", () => {
    const val$ = observable("hello");
    const opts = { val: val$ };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { val: "default" }));
    expect(result.current.val.get()).toBe("hello");
  });

  it("plain field value is resolved as-is", () => {
    const opts = { val: "static" };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { val: "default" }));
    expect(result.current.val.get()).toBe("static");
  });

  it("function field without hint → stored as raw reference (no ObservableHint.function wrapping)", () => {
    const spy = vi.spyOn(ObservableHint, "function");
    const cb = () => {};
    const { result } = renderHook(() => useToObs<{ cb: () => void }>({ cb }, {}));
    result.current.get();
    // Rule 9: 'function' hint is forbidden — callback must be stored as-is, not wrapped
    expect(spy).not.toHaveBeenCalled();
    // The raw cb reference is preserved (accessible via raw-prop access pattern)
    spy.mockRestore();
  });
});

// =============================================================================
// Object-form: 'opaque' hint
// =============================================================================

describe("useToObs() — object-form: 'opaque'", () => {
  it("calls ObservableHint.opaque with the resolved value", () => {
    const spy = vi.spyOn(ObservableHint, "opaque");
    const element = document.createElement("div");
    const { result } = renderHook(() =>
      useToObs<{ element: HTMLElement }>({ element }, { element: "opaque" })
    );
    result.current.get();
    expect(spy).toHaveBeenCalledWith(element);
    spy.mockRestore();
  });

  it("value is accessible via .get()", () => {
    const element = document.createElement("div");
    const { result } = renderHook(() =>
      useToObs<{ element: HTMLElement }>({ element }, { element: "opaque" })
    );
    expect(result.current.element.get()).toBe(element);
  });

  it("null field value → ObservableHint.opaque NOT called (null-safe)", () => {
    const spy = vi.spyOn(ObservableHint, "opaque");
    const el$ = observable<HTMLElement | null>(null);
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useToObs({ element: el$ } as any, { element: "opaque" } as any)
    );
    result.current.get();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("undefined field → ObservableHint.opaque NOT called (null-safe)", () => {
    const spy = vi.spyOn(ObservableHint, "opaque");
    const { result } = renderHook(() =>
      useToObs<{ element?: HTMLElement }>({ element: undefined }, { element: "opaque" })
    );
    result.current.get();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// =============================================================================
// Object-form: 'plain' hint
// =============================================================================

describe("useToObs() — object-form: 'plain'", () => {
  it("calls ObservableHint.plain with the resolved value", () => {
    const spy = vi.spyOn(ObservableHint, "plain");
    const nested = { key: "value" };
    const { result } = renderHook(() =>
      useToObs<{ nested: object }>({ nested }, { nested: "plain" })
    );
    result.current.get();
    expect(spy).toHaveBeenCalledWith(nested);
    spy.mockRestore();
  });

  it("null field value → ObservableHint.plain NOT called (null-safe)", () => {
    const spy = vi.spyOn(ObservableHint, "plain");
    const nested$ = observable<object | null>(null);
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useToObs({ nested: nested$ } as any, { nested: "plain" } as any)
    );
    result.current.get();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// =============================================================================
// Object-form: custom function hint
// =============================================================================

describe("useToObs() — object-form: custom function hint", () => {
  it("calls custom fn with the raw field value (Observable or plain)", () => {
    const val$ = observable("hello");
    const opts = { val: val$ };
    const customHint = vi.fn((v: unknown) => (isObservable(v) ? (v as typeof val$).get() : v));
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { val: customHint }));
    result.current.val.get();
    expect(customHint).toHaveBeenCalledWith(val$);
    expect(result.current.val.get()).toBe("hello");
  });

  it("custom fn return value is stored in opts$", () => {
    const customHint = (_v: unknown) => "custom-result";
    const opts = { val: "ignored" };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { val: customHint }));
    expect(result.current.val.get()).toBe("custom-result");
  });
});

// =============================================================================
// Object-form bypassed for outer Observable
// =============================================================================

describe("useToObs() — object-form bypassed for outer Observable", () => {
  it("hints have no effect — opts$ reacts to whole-object replace as normal", () => {
    const options$ = observable<SimpleOpts>({ val: "initial" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(options$, { val: "opaque" }));
    expect(result.current.val.get()).toBe("initial");
    act(() => {
      options$.set({ val: "replaced" });
    });
    expect(result.current.val.get()).toBe("replaced");
  });
});

// =============================================================================
// Edge cases
// =============================================================================

describe("useToObs() — edge cases", () => {
  it("plain options reference change between renders → opts$ recomputes with new value", () => {
    const { result, rerender } = renderHook(
      ({ opts }: { opts: SimpleOpts }) => useToObs<SimpleOpts>(opts),
      { initialProps: { opts: { val: "first" } } }
    );
    expect(result.current.val.get()).toBe("first");
    rerender({ opts: { val: "second" } });
    expect(result.current.val.get()).toBe("second");
  });

  it("same-reference options between renders → value is stable", () => {
    const opts = { val: "stable" };
    const { result, rerender } = renderHook(() => useToObs<SimpleOpts>(opts));
    rerender();
    expect(result.current.val.get()).toBe("stable");
  });

  it("null options with object-form transform → Observable<undefined> (null-safe)", () => {
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useToObs<SimpleOpts>(null as any, { val: "default" })
    );
    expect(result.current.get()).toBeUndefined();
  });

  it("undefined options with object-form transform → Observable<undefined>", () => {
    const { result } = renderHook(() => useToObs<SimpleOpts>(undefined, { val: "default" }));
    expect(result.current.get()).toBeUndefined();
  });

  it("undefined options with function-form transform → transform receives undefined", () => {
    const compute = vi.fn((_raw) => undefined);
    const { result } = renderHook(() => useToObs<SimpleOpts>(undefined, compute));
    result.current.get();
    expect(compute).toHaveBeenCalledWith(undefined);
  });
});

// =============================================================================
// Trigger count: plain useState options
// =============================================================================

describe("useToObs() — trigger count with plain useState options", () => {
  it("useState value change → opts$ notified exactly once", () => {
    let callCount = 0;

    const { result } = renderHook(() => {
      // eslint-disable-next-line use-legend/prefer-use-observable
      const [opts, setOpts] = useState<SimpleOpts>({ val: "a" });
      const opts$ = useToObs<SimpleOpts>(opts);
      return { setOpts, opts$ };
    });

    // observe runs synchronously once on setup to track deps, then on each change
    const dispose = observe(() => {
      result.current.opts$.get();
      callCount++;
    });
    const baseline = callCount; // 1 — initial synchronous run

    act(() => {
      result.current.setOpts({ val: "b" });
    });

    expect(callCount - baseline).toBe(1);
    dispose();
  });
});

// =============================================================================
// Linked option (bidirectional write-back)
// =============================================================================

describe("useToObs() — linked option (bidirectional)", () => {
  it("outer Observable + linked: read works", () => {
    const source$ = observable<SimpleOpts>({ val: "hello" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(source$, { linked: true }));
    expect(result.current.val.get()).toBe("hello");
  });

  it("outer Observable + linked: set writes back to source", () => {
    const source$ = observable<SimpleOpts>({ val: "original" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(source$, { linked: true }));
    act(() => {
      result.current.set({ val: "updated" });
    });
    expect(source$.val.get()).toBe("updated");
  });

  it("outer Observable + linked: source change propagates to result", () => {
    const source$ = observable<SimpleOpts>({ val: "a" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(source$, { linked: true }));
    act(() => {
      source$.set({ val: "b" });
    });
    expect(result.current.val.get()).toBe("b");
  });

  it("outer Observable + linked: bidirectional round-trip", () => {
    const source$ = observable<SimpleOpts>({ val: "start" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(source$, { linked: true }));

    // read
    expect(result.current.val.get()).toBe("start");

    // write via result → source
    act(() => {
      result.current.set({ val: "from-result" });
    });
    expect(source$.val.get()).toBe("from-result");

    // write via source → result
    act(() => {
      source$.set({ val: "from-source" });
    });
    expect(result.current.val.get()).toBe("from-source");
  });

  it("plain value + linked: set is silently ignored (no crash)", () => {
    const { result } = renderHook(() => useToObs<SimpleOpts>({ val: "plain" }, { linked: true }));
    expect(result.current.val.get()).toBe("plain");

    // set should not throw
    expect(() => {
      act(() => {
        result.current.set({ val: "ignored" });
      });
    }).not.toThrow();
  });

  it("per-field Observable + linked: set is silently ignored", () => {
    const val$ = observable("field");
    const opts = { val: val$ };
    const { result } = renderHook(() => useToObs<SimpleOpts>(opts, { linked: true }));
    expect(result.current.val.get()).toBe("field");

    // set should not throw — per-field is not an outer Observable
    expect(() => {
      act(() => {
        result.current.set({ val: "ignored" });
      });
    }).not.toThrow();

    // original per-field observable unchanged
    expect(val$.get()).toBe("field");
  });

  it("linked: false (default) — set does NOT write back", () => {
    const source$ = observable<SimpleOpts>({ val: "original" });
    const { result } = renderHook(() => useToObs<SimpleOpts>(source$));
    act(() => {
      result.current.set({ val: "attempted" });
    });
    // without linked, set goes to the computed observable, not back to source
    // source should remain unchanged
    expect(source$.val.get()).toBe("original");
  });

  it("linked + function-form transform: get uses transform", () => {
    const source$ = observable<SimpleOpts>({ val: "raw" });
    const { result } = renderHook(() =>
      useToObs<SimpleOpts>(source$, {
        transform: (raw) => {
          const v = isObservable(raw)
            ? (raw as typeof source$).get()
            : (raw as SimpleOpts | undefined);
          return v ? { val: v.val + "!" } : undefined;
        },
        linked: true,
      })
    );
    expect(result.current.val.get()).toBe("raw!");
  });

  it("linked + transform: set writes raw value to source (bypasses transform)", () => {
    const source$ = observable<SimpleOpts>({ val: "raw" });
    const { result } = renderHook(() =>
      useToObs<SimpleOpts>(source$, {
        transform: (raw) => {
          const v = isObservable(raw)
            ? (raw as typeof source$).get()
            : (raw as SimpleOpts | undefined);
          return v ? { val: v.val + "!" } : undefined;
        },
        linked: true,
      })
    );
    // get returns transformed
    expect(result.current.val.get()).toBe("raw!");

    // set writes raw value directly to source
    act(() => {
      result.current.set({ val: "new" });
    });
    expect(source$.val.get()).toBe("new");

    // get now reflects new source through transform
    expect(result.current.val.get()).toBe("new!");
  });

  it("linked: Observable reference is stable across rerenders", () => {
    const source$ = observable<SimpleOpts>({ val: "stable" });
    const { result, rerender } = renderHook(() => useToObs<SimpleOpts>(source$, { linked: true }));
    const first = result.current;
    rerender();
    const second = result.current;
    expect(first).toBe(second);
  });
});
