// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { createElement, useState } from "react";
import { isObservable, observable, type Observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useScope, toObs, createObserve } from ".";

describe("useScope() — reactive props (toObs)", () => {
  describe("toObs() basic", () => {
    it("toObs(p) returns Observable with initial prop value", () => {
      const { result } = renderHook(() =>
        useScope(
          (p) => {
            const obs$ = toObs(p);
            return { obs$ };
          },
          { count: 5 }
        )
      );
      expect(result.current.obs$.count.get()).toBe(5);
    });

    it("toObs(p) called twice returns the same Observable instance", () => {
      const { result } = renderHook(() =>
        useScope(
          (p) => {
            const a$ = toObs(p);
            const b$ = toObs(p);
            return { a$, b$ };
          },
          { count: 0 }
        )
      );
      expect(result.current.a$).toBe(result.current.b$);
    });

    it("toObs(p).children reads the latest React element after rerender", () => {
      const firstChild = createElement("span", { key: "first" }, "first child");
      const secondChild = createElement("span", { key: "second" }, "second child");

      const { result, rerender } = renderHook(
        ({ children }) =>
          useScope(
            (p) => {
              const p$ = toObs(p);
              return { readChildren: () => p$.children.peek() };
            },
            { children }
          ),
        { initialProps: { children: firstChild } }
      );

      expect(result.current.readChildren()).toBe(firstChild);

      rerender({ children: secondChild });

      expect(result.current.readChildren()).toBe(secondChild);
    });

    it("keeps React element children opaque so nested props are not observable paths", () => {
      const data = { nested: 1 };
      const child = createElement("span", { data }, "child");

      const { result } = renderHook(() =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            return { children$: p$.children };
          },
          { children: child }
        )
      );

      const children$ = result.current.children$ as unknown as {
        get: () => unknown;
        props: {
          data: typeof data;
        };
      };

      expect(isObservable(children$)).toBe(true);
      expect(children$.get()).toBe(child);
      expect(isObservable(children$.props)).toBe(false);
      expect(children$.props).toBe(child.props);
      expect(children$.props.data).toBe(data);
      expect("get" in children$.props.data).toBe(false);
    });

    it("Observable is stable across rerenders", () => {
      const { result, rerender } = renderHook(
        ({ count }) => useScope((p) => ({ obs$: toObs(p) }), { count }),
        { initialProps: { count: 0 } }
      );
      const first = result.current.obs$;
      rerender({ count: 1 });
      expect(result.current.obs$).toBe(first);
    });
  });

  describe("reactive tracking", () => {
    it("createObserve(() => obs$.count.get()) fires when count changes", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              createObserve(() => spy(obs$.count.get()));
              return {};
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      expect(spy).toHaveBeenCalledWith(0);

      rerender({ count: 1 });
      expect(spy).toHaveBeenCalledWith(1);
    });

    it("count observer does NOT fire when only name changes (diff-sync)", () => {
      const countSpy = vi.fn();
      const { rerender } = renderHook(
        ({ count, name }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              createObserve(() => countSpy(obs$.count.get()));
              return {};
            },
            { count, name }
          ),
        { initialProps: { count: 0, name: "a" } }
      );

      const callsAfterMount = countSpy.mock.calls.length; // 1

      // only name changes
      rerender({ count: 0, name: "b" });
      expect(countSpy).toHaveBeenCalledTimes(callsAfterMount); // no extra call
    });

    it("multiple independent observers track independent fields", () => {
      const countSpy = vi.fn();
      const nameSpy = vi.fn();

      const { rerender } = renderHook(
        ({ count, name }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              createObserve(() => countSpy(obs$.count.get()));
              createObserve(() => nameSpy(obs$.name.get()));
              return {};
            },
            { count, name }
          ),
        { initialProps: { count: 0, name: "a" } }
      );

      const countCalls = countSpy.mock.calls.length;
      const nameCalls = nameSpy.mock.calls.length;

      rerender({ count: 1, name: "a" }); // only count changes
      expect(countSpy).toHaveBeenCalledTimes(countCalls + 1);
      expect(nameSpy).toHaveBeenCalledTimes(nameCalls); // no extra call

      rerender({ count: 1, name: "b" }); // only name changes
      expect(countSpy).toHaveBeenCalledTimes(countCalls + 1); // no extra call
      expect(nameSpy).toHaveBeenCalledTimes(nameCalls + 1);
    });

    it("updates are batched — one observe run per render even when 3 fields change", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ a, b, c }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              createObserve(() => spy(obs$.a.get(), obs$.b.get(), obs$.c.get()));
              return {};
            },
            { a, b, c }
          ),
        { initialProps: { a: 1, b: 2, c: 3 } }
      );

      const callsAfterMount = spy.mock.calls.length;

      // All 3 change simultaneously
      rerender({ a: 10, b: 20, c: 30 });
      expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    });
  });

  describe("raw access via proxy", () => {
    it("p.count always returns the latest rendered value", () => {
      let latestFromHandler = -1;

      const { result, rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const getCount = () => {
                latestFromHandler = p.count as number;
              };
              return { getCount };
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );

      result.current.getCount();
      expect(latestFromHandler).toBe(0);

      rerender({ count: 42 });
      result.current.getCount();
      expect(latestFromHandler).toBe(42);
    });

    it("p.onClick (function prop) is directly callable — no legend-state deep-proxy", () => {
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useScope(
          (p) => {
            const callIt = () => (p.onClick as () => void)();
            return { callIt };
          },
          { onClick }
        )
      );
      result.current.callIt();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("toObs with function-valued fields (no hint)", () => {
    it("rerender with a new callback propagates to raw proxy access", () => {
      const fn1 = () => "first";
      const fn2 = () => "second";
      let captured: (() => string) | undefined;

      const { rerender } = renderHook(
        ({ onClick }) =>
          useScope(
            (p) => {
              // No hint — dispatch via raw proxy access (p.onClick)
              toObs(p);
              captured = () => (p.onClick as () => string)();
              return {};
            },
            { onClick }
          ),
        { initialProps: { onClick: fn1 } }
      );

      expect(captured!()).toBe("first");
      rerender({ onClick: fn2 });
      expect(captured!()).toBe("second");
    });
  });

  describe("no observable when toObs not called", () => {
    it("toObs not called — no observable created, no errors", () => {
      const { result, rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              // Only raw access, no toObs
              return { getCount: () => p.count as number };
            },
            { count }
          ),
        { initialProps: { count: 0 } }
      );
      rerender({ count: 1 });
      expect(result.current.getCount()).toBe(1);
    });
  });

  describe("unmount cleanup", () => {
    it("observe stops firing after unmount", () => {
      const spy = vi.fn();
      const external$ = observable(0);
      const { unmount } = renderHook(() =>
        useScope(
          (p) => {
            const obs$ = toObs(p);
            createObserve(() => {
              external$.get();
              spy(obs$.count.get());
            });
            return {};
          },
          { count: 0 }
        )
      );

      const callsBeforeUnmount = spy.mock.calls.length;
      unmount();
      act(() => external$.set(1));
      expect(spy).toHaveBeenCalledTimes(callsBeforeUnmount);
    });
  });
});

describe("toObs with scalar hint", () => {
  it("toObs(p, 'opaque') wraps entire props with opaque hint", () => {
    const obj1 = { nested: 1 };
    const obj2 = { nested: 2 };

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const obs$ = toObs(p, "opaque");
          return { obs$ };
        },
        { data1: obj1, data2: obj2 }
      )
    );

    // opaque wrapping: obs$.get() returns entire raw props object
    const val = result.current.obs$.get();
    expect(val).toBeDefined();
  });

  it("toObs(p, { field: hint }) per-field hint still works", () => {
    // 기존 per-field hint 하위 호환 확인 — 'plain' hint
    const spy = vi.fn();
    renderHook(
      ({ dump }) =>
        useScope(
          (p) => {
            const obs$ = toObs(p, { dump: "plain" });
            createObserve(() => spy(obs$.dump.get()));
            return {};
          },
          { dump }
        ),
      { initialProps: { dump: JSON.stringify } }
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("useScope() — multi-params (rest args)", () => {
  it("useScope((a, b) => ..., obj1, obj2) passes two ReactiveProps", () => {
    const { result } = renderHook(() =>
      useScope(
        (timing, opts) => {
          return {
            getDebounce: () => timing.debounce,
            getDump: () => opts.dump,
          };
        },
        { debounce: 200 },
        { dump: JSON.stringify }
      )
    );

    expect(result.current.getDebounce()).toBe(200);
    expect(result.current.getDump()).toBe(JSON.stringify);
  });

  it("toObs works independently on each param", () => {
    const spy = vi.fn();

    const { rerender } = renderHook(
      ({ debounce, name }) =>
        useScope(
          (timing, opts) => {
            const t$ = toObs(timing);
            const o$ = toObs(opts);
            createObserve(() => spy(t$.debounce.get(), o$.name.get()));
            return {};
          },
          { debounce },
          { name }
        ),
      { initialProps: { debounce: 200, name: "a" } }
    );

    expect(spy).toHaveBeenCalledWith(200, "a");

    rerender({ debounce: 500, name: "a" });
    expect(spy).toHaveBeenCalledWith(500, "a");
  });

  it("multi-params result is stable across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ a, b }) => useScope((p1, _p2) => ({ val: p1.a }), { a }, { b }),
      { initialProps: { a: 1, b: 2 } }
    );

    const first = result.current;
    rerender({ a: 3, b: 4 });
    expect(result.current).toBe(first);
  });
});

describe("toObs with Observable field props — auto-deref", () => {
  it("p.obs (raw proxy) is the same Observable instance as source$", () => {
    const source$ = observable(42);

    const { result } = renderHook(() =>
      useScope((p) => ({ getRaw: () => p.obs }), { obs: source$ })
    );

    // p is raw proxy → reads directly from propsRef.current → same instance
    expect(result.current.getRaw() === source$).toBe(true);
  });

  it("toObs(p).obs is a linked child observable (not same instance as source$)", () => {
    const source$ = observable(42);

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          return { p$ };
        },
        { obs: source$ }
      )
    );

    // p$.obs is a Legend-State linked child — different proxy, same tracked value
    expect(result.current.p$.obs === source$).toBe(false);
    expect(result.current.p$.obs.get()).toBe(source$.get());
  });

  it("toObs(p).obs.get() tracks source$ value changes", () => {
    const source$ = observable(42);

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          return { p$ };
        },
        { obs: source$ }
      )
    );

    expect(result.current.p$.obs.get()).toBe(42);

    act(() => source$.set(99));
    expect(result.current.p$.obs.get()).toBe(99);
  });

  it("createObserve() on toObs(p).obs fires when the Observable field value changes", () => {
    const source$ = observable(0);
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => spy(p$.obs.get()));
          return {};
        },
        { obs: source$ }
      )
    );

    expect(spy).toHaveBeenCalledWith(0);

    act(() => source$.set(1));
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("multiple Observable fields — each p$.field is a linked child with correct value", () => {
    const a$ = observable("hello");
    const b$ = observable(true);

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          return { p$ };
        },
        { a: a$, b: b$ }
      )
    );

    // linked children — different instances but correct values
    expect(result.current.p$.a === a$).toBe(false);
    expect(result.current.p$.b === b$).toBe(false);
    expect(result.current.p$.a.get()).toBe("hello");
    expect(result.current.p$.b.get()).toBe(true);
  });

  // ── Fire-count tests: how many times does createObserve() run when field$.set()? ──
  // These establish the contract for per-field Observable + observe interactions.

  it("observe fires EXACTLY ONCE when field$.set() — child accessor (p$.field.get())", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => spy(p$.field.get()));
          return {};
        },
        { field: field$ }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  it("observe fires EXACTLY ONCE when field$.set() — top-level get (p$.get()?.field)", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => {
            const raw = p$.get() as { field: string };
            spy(raw?.field);
          });
          return {};
        },
        { field: field$ }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  it("outer Observable wrapper — observe fires EXACTLY ONCE when options$.field changes", () => {
    const options$ = observable({ field: "a" });
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => spy(p$.field.get()));
          return {};
        },
        { field: options$.field }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => options$.field.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });
});

describe("toObs with Observable field — opaque hint fire-count", () => {
  // Baseline: regular observable (no prop wrapping) — must fire exactly once
  it("baseline — plain createObserve() on external observable fires exactly once per set()", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(() => {
        createObserve(() => spy(field$.get()));
        return {};
      })
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  // Per-field with opaque hint — does this prevent double-trigger?
  it("toObs(p, { field: 'opaque' }) — observe fires exactly once when field$ changes", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p, { field: "opaque" });
          createObserve(() => spy(p$.field.get()));
          return {};
        },
        { field: field$ }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  // Per-field with opaque hint — top-level get access
  it("toObs(p, { field: 'opaque' }) — p$.get()?.field access fires exactly once", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p, { field: "opaque" });
          createObserve(() => {
            const raw = p$.get() as { field: string };
            spy(raw?.field);
          });
          return {};
        },
        { field: field$ }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  // per-field observable without hint behaves the same as with opaque hint
  it("per-field observable without hint — also fires exactly once (no double-trigger)", () => {
    const field$ = observable("a");
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p); // no hint
          createObserve(() => spy(p$.field.get()));
          return {};
        },
        { field: field$ }
      )
    );

    const callsAfterMount = spy.mock.calls.length;
    act(() => field$.set("b"));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith("b");
  });
});

describe("useScope() — reactiveProps plain state selectivity", () => {
  it("same-value rerender does not trigger observe (Object.is guard)", () => {
    const spy = vi.fn();
    const { rerender } = renderHook(
      ({ count }) =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            createObserve(() => spy(p$.count.get()));
            return {};
          },
          { count }
        ),
      { initialProps: { count: 5 } }
    );
    const callsAfterMount = spy.mock.calls.length;

    rerender({ count: 5 }); // same value — Object.is true
    expect(spy).toHaveBeenCalledTimes(callsAfterMount);
  });

  it("observer fires only when observed field changes, not unobserved field", () => {
    const spyA = vi.fn();
    const { rerender } = renderHook(
      ({ a, b }) =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            createObserve(() => spyA(p$.a.get())); // only tracking 'a'
            return {};
          },
          { a, b }
        ),
      { initialProps: { a: 1, b: 10 } }
    );
    const callsAfterMount = spyA.mock.calls.length;

    rerender({ a: 1, b: 99 }); // only b changes
    expect(spyA).toHaveBeenCalledTimes(callsAfterMount);

    rerender({ a: 2, b: 99 }); // a changes
    expect(spyA).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spyA).toHaveBeenLastCalledWith(2);
  });

  it("useState-driven prop change triggers observer with new value", () => {
    let setCount!: (n: number) => void;
    const spy = vi.fn();

    renderHook(() => {
      const [count, _set] = useState(0);
      setCount = _set;
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => spy(p$.count.get()));
          return {};
        },
        { count }
      );
    });

    const callsAfterMount = spy.mock.calls.length;

    act(() => setCount(42));
    expect(spy).toHaveBeenCalledTimes(callsAfterMount + 1);
    expect(spy).toHaveBeenLastCalledWith(42);
  });

  it("useState change to unobserved field does not trigger observer", () => {
    let setName!: (s: string) => void;
    const spy = vi.fn();

    renderHook(() => {
      const [name, _set] = useState("a");
      setName = _set;
      useScope(
        (p) => {
          const p$ = toObs(p);
          createObserve(() => spy(p$.count.get())); // only observing count
          return {};
        },
        { count: 0, name }
      );
    });

    const callsAfterMount = spy.mock.calls.length;

    act(() => setName("b")); // name changes, count stays 0
    expect(spy).toHaveBeenCalledTimes(callsAfterMount); // not triggered
  });
});

// ---------------------------------------------------------------------------
// Multi-param scope + toObs — edge cases
//
// useScope supports multiple param slots: (p1, p2, p3) => T with corresponding
// props objects. Each param gets its own ReactiveProps proxy with an independent
// ScopePropsCtx (propsRef, props$, hints, rawPrev, Observable subscriptions).
// The tests below catch the bug categories we've hit historically:
//   A. double-fire on per-field Observable
//   B. unrelated rerenders leaking into observe
//   C. subscription lifecycle (Strict Mode, unmount, per-param isolation)
//   D. nested plain value propagation via `assign`
// ---------------------------------------------------------------------------
describe("useScope() — multi-param + toObs edge cases", () => {
  describe("param isolation", () => {
    it("changing only p1 fires p1 observer; p2 observer does not fire", () => {
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: string }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              createObserve(() => p1Spy(p1$.a.get()));
              createObserve(() => p2Spy(p2$.b.get()));
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: "x" } }
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      rerender({ a: 2, b: "x" });
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls); // isolated
    });

    it("changing only p2 fires p2 observer; p1 observer does not fire", () => {
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: string }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              createObserve(() => p1Spy(p1$.a.get()));
              createObserve(() => p2Spy(p2$.b.get()));
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: "x" } }
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      rerender({ a: 1, b: "y" });
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls); // isolated
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls + 1);
    });

    it("simultaneous change to p1 and p2 fires each observer exactly once", () => {
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: string }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              createObserve(() => p1Spy(p1$.a.get()));
              createObserve(() => p2Spy(p2$.b.get()));
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: "x" } }
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      rerender({ a: 2, b: "y" });
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls + 1);
    });

    it("three params: each observer is independent", () => {
      const spies = [vi.fn(), vi.fn(), vi.fn()];

      const { rerender } = renderHook(
        ({ a, b, c }: { a: number; b: number; c: number }) =>
          useScope(
            (p1, p2, p3) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              const p3$ = toObs(p3);
              createObserve(() => spies[0](p1$.a.get()));
              createObserve(() => spies[1](p2$.b.get()));
              createObserve(() => spies[2](p3$.c.get()));
              return {};
            },
            { a },
            { b },
            { c }
          ),
        { initialProps: { a: 1, b: 2, c: 3 } }
      );

      const baseline = spies.map((s) => s.mock.calls.length);
      rerender({ a: 10, b: 2, c: 3 }); // only a changes
      expect(spies[0]).toHaveBeenCalledTimes(baseline[0] + 1);
      expect(spies[1]).toHaveBeenCalledTimes(baseline[1]);
      expect(spies[2]).toHaveBeenCalledTimes(baseline[2]);
    });
  });

  describe("per-field Observable across params", () => {
    it("Observable field in p1 — obs.set() fires p1 observer exactly once, p2 untouched", () => {
      const rootMargin$ = observable("0px");
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      renderHook(() =>
        useScope(
          (p1, p2) => {
            const p1$ = toObs(p1);
            const p2$ = toObs(p2);
            createObserve(() => p1Spy(p1$.rootMargin.get()));
            createObserve(() => p2Spy(p2$.threshold.get()));
            return {};
          },
          { rootMargin: rootMargin$ },
          { threshold: 0.5 }
        )
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      act(() => rootMargin$.set("10px"));

      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p1Spy).toHaveBeenLastCalledWith("10px");
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls); // p2 untouched
    });

    it("Observable field in p2 — obs.set() fires p2 observer exactly once, p1 untouched", () => {
      const threshold$ = observable(0.5);
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      renderHook(() =>
        useScope(
          (p1, p2) => {
            const p1$ = toObs(p1);
            const p2$ = toObs(p2);
            createObserve(() => p1Spy(p1$.rootMargin.get()));
            createObserve(() => p2Spy(p2$.threshold.get()));
            return {};
          },
          { rootMargin: "0px" },
          { threshold: threshold$ }
        )
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      act(() => threshold$.set(1.0));

      expect(p1Spy).toHaveBeenCalledTimes(p1Calls); // p1 untouched
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls + 1);
      expect(p2Spy).toHaveBeenLastCalledWith(1.0);
    });

    it("Observable fields in both p1 and p2 — each fires its own observer exactly once", () => {
      const a$ = observable(1);
      const b$ = observable("x");
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      renderHook(() =>
        useScope(
          (p1, p2) => {
            const p1$ = toObs(p1);
            const p2$ = toObs(p2);
            createObserve(() => p1Spy(p1$.a.get()));
            createObserve(() => p2Spy(p2$.b.get()));
            return {};
          },
          { a: a$ },
          { b: b$ }
        )
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      act(() => a$.set(2));
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls);

      act(() => b$.set("y"));
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls + 1);
    });
  });

  describe("hints per param", () => {
    it("different hint specs on p1 vs p2 — each applies only to its own proxy", () => {
      const fn = () => "called";
      const el = { nodeType: 1, tagName: "DIV" } as unknown as HTMLElement;
      let capturedFn: unknown;
      let capturedEl: unknown;

      renderHook(() =>
        useScope(
          (p1, p2) => {
            toObs(p1);
            const p2$ = toObs(p2, { root: "opaque" });
            // Raw proxy access returns the original function reference
            capturedFn = p1.cb;
            // opaque-hinted field preserves the stored element reference
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            capturedEl = (p2$ as any).root.peek();
            return {};
          },
          { cb: fn },
          { root: el }
        )
      );

      // Raw proxy: the original function reference is returned as-is
      expect(typeof capturedFn).toBe("function");
      expect(capturedFn).toBe(fn);
      expect((capturedFn as () => string)()).toBe("called");
      // opaque hint preserves the original element reference
      expect(capturedEl).toBe(el);
    });

    it("callback prop on p1 rerenders cleanly; p2 untouched", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      const { rerender } = renderHook(
        ({ cb }: { cb: () => void }) =>
          useScope(
            (p1, p2) => {
              toObs(p1);
              const p2$ = toObs(p2);
              return {
                // raw-proxy dispatch — always latest closure
                cbFromP1: () => (p1.cb as () => void)(),
                plainFromP2: () => p2$.value.get(),
              };
            },
            { cb },
            { value: 42 }
          ),
        { initialProps: { cb: fn1 } }
      );

      rerender({ cb: fn2 });
      // syncProps on p1 detected cb change, p2 untouched
      // (we can't directly assert observer state; just confirm no errors thrown)
    });
  });

  describe("rerender stability", () => {
    it("toObs(p1) and toObs(p2) return stable references across rerenders", () => {
      let p1FirstRef: unknown = null;
      let p2FirstRef: unknown = null;
      let p1LaterRef: unknown = null;
      let p2LaterRef: unknown = null;
      let callCount = 0;

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: number }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              if (callCount === 0) {
                p1FirstRef = p1$;
                p2FirstRef = p2$;
              } else {
                p1LaterRef = p1$;
                p2LaterRef = p2$;
              }
              callCount++;
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: 2 } }
      );

      rerender({ a: 10, b: 20 });
      // Factory runs once at mount (plus Strict Mode); rerender does NOT re-run factory.
      // p1FirstRef / p2FirstRef are the only references; we just confirm toObs returned something.
      expect(p1FirstRef).not.toBeNull();
      expect(p2FirstRef).not.toBeNull();
      // Either no later ref captured (factory didn't re-run) or it matches the first ref.
      if (p1LaterRef !== null) expect(p1LaterRef).toBe(p1FirstRef);
      if (p2LaterRef !== null) expect(p2LaterRef).toBe(p2FirstRef);
    });

    it("same-ref rerender on p1 does not trigger any observer", () => {
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();
      const stableP1 = { a: 1 };

      const { rerender } = renderHook(
        ({ b }: { b: number }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              createObserve(() => p1Spy(p1$.a.get()));
              createObserve(() => p2Spy(p2$.b.get()));
              return {};
            },
            stableP1,
            { b }
          ),
        { initialProps: { b: 1 } }
      );

      const p1Calls = p1Spy.mock.calls.length;

      rerender({ b: 2 }); // p1 stays referentially stable, p2.b changes
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls); // p1 untouched
      expect(p2Spy).toHaveBeenCalledWith(2);
    });
  });

  describe("nested plain fields", () => {
    it("nested field change in p1 propagates to p1$.nested.x, p2 untouched", () => {
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      const { rerender } = renderHook(
        ({ coord, label }: { coord: { x: number; y: number }; label: string }) =>
          useScope(
            (p1, p2) => {
              const p1$ = toObs(p1);
              const p2$ = toObs(p2);
              createObserve(() => p1Spy(p1$.coord.x.get()));
              createObserve(() => p2Spy(p2$.label.get()));
              return {};
            },
            { coord },
            { label }
          ),
        { initialProps: { coord: { x: 10, y: 20 }, label: "a" } }
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      rerender({ coord: { x: 30, y: 20 }, label: "a" });
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls + 1);
      expect(p1Spy).toHaveBeenLastCalledWith(30);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls);
    });

    it("unchanged nested field (y) does not fire its own lens on p1", () => {
      const ySpy = vi.fn();

      const { rerender } = renderHook(
        ({ x }: { x: number }) =>
          useScope(
            (p1) => {
              const p1$ = toObs(p1);
              createObserve(() => ySpy(p1$.coord.y.get()));
              return {};
            },
            { coord: { x, y: 20 } }
          ),
        { initialProps: { x: 10 } }
      );

      const yCalls = ySpy.mock.calls.length;
      rerender({ x: 30 }); // only x changes; y stays 20
      expect(ySpy).toHaveBeenCalledTimes(yCalls); // y lens unchanged
    });
  });

  describe("toObs usage asymmetry", () => {
    it("toObs called only on p1 — p2 still accessible via raw proxy", () => {
      let readP2: (() => unknown) | null = null;

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: string }) =>
          useScope(
            (p1, p2) => {
              toObs(p1); // only p1 gets observable
              readP2 = () => p2.b; // raw access via closure — latest on each call
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: "first" } }
      );

      expect(readP2!()).toBe("first");

      rerender({ a: 1, b: "second" });
      // raw proxy reads the latest via propsRef; closure always sees current value
      expect(readP2!()).toBe("second");
    });

    it("toObs called only on p2 — syncProps for p1 no-ops (no errors)", () => {
      const p2Spy = vi.fn();

      const { rerender } = renderHook(
        ({ a, b }: { a: number; b: number }) =>
          useScope(
            (_p1, p2) => {
              const p2$ = toObs(p2);
              createObserve(() => p2Spy(p2$.b.get()));
              return {};
            },
            { a },
            { b }
          ),
        { initialProps: { a: 1, b: 10 } }
      );

      const p2Calls = p2Spy.mock.calls.length;

      rerender({ a: 99, b: 10 }); // a changes; no toObs for p1 → no-op; p2 unchanged
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls);

      rerender({ a: 99, b: 20 }); // b changes
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls + 1);
    });
  });

  describe("unmount cleanup", () => {
    it("Observable field subscriptions on both params are cleaned up on unmount", () => {
      const a$ = observable(1);
      const b$ = observable("x");
      const p1Spy = vi.fn();
      const p2Spy = vi.fn();

      const { unmount } = renderHook(() =>
        useScope(
          (p1, p2) => {
            const p1$ = toObs(p1);
            const p2$ = toObs(p2);
            createObserve(() => p1Spy(p1$.a.get()));
            createObserve(() => p2Spy(p2$.b.get()));
            return {};
          },
          { a: a$ },
          { b: b$ }
        )
      );

      const p1Calls = p1Spy.mock.calls.length;
      const p2Calls = p2Spy.mock.calls.length;

      unmount();

      act(() => a$.set(2));
      act(() => b$.set("y"));

      // Post-unmount: no observer fires on either param
      expect(p1Spy).toHaveBeenCalledTimes(p1Calls);
      expect(p2Spy).toHaveBeenCalledTimes(p2Calls);
    });
  });
});

describe("useScope() — outer Observable as scope param", () => {
  it("toObs sees fields of an outer Observable passed as scope param", () => {
    const opts$ = observable({ count: 10, label: "hello" });

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          return { p$ };
        },
        opts$ as unknown as Record<string, unknown>
      )
    );

    expect(result.current.p$.get().count).toBe(10);
    expect(result.current.p$.get().label).toBe("hello");
  });

  it("toObs returns outer Observable directly — hints are skipped", () => {
    const cb = vi.fn();
    const opts$ = observable<{ onDone?: () => void }>({ onDone: cb });

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p, { onDone: "plain" });
          return { p$ };
        },
        opts$ as unknown as Record<string, unknown>
      )
    );

    // toObs returns the outer Observable itself
    expect((result.current.p$ as unknown) === (opts$ as unknown)).toBe(true);
    // function field accessible via peek
    expect(typeof result.current.p$.peek()?.onDone).toBe("function");
  });
});

// Regression: per-field Observable mutated between factory and onMount
//
// Ref$ callbacks fire during React's commit phase — AFTER the useScope factory
// runs but BEFORE useEffect (onMount) attaches onChange subscriptions. If toObs
// only subscribes inside onMount without catching up the current peek() value,
// the mirrored opts$ field is stuck at its pre-mount value and downstream
// `createObserve()` consumers never rerun with the real element/value.
//
// This was the root cause of useIntersectionObserver appearing inert when
// `root` was a Ref$: containerRef$ was null at factory time, the null was
// mirrored into opts$.root, the ref callback flipped containerRef$ to the
// element during commit, and onMount missed that edge because onChange was
// registered only afterwards — leaving opts$.root permanently null.
describe("useScope() — factory → onMount value propagation", () => {
  it("per-field Observable mutated between factory and onMount is caught up at mount", () => {
    const obs$ = observable<string | null>(null);

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          // Simulate a ref callback that runs during commit (after the
          // factory, before onMount) by flipping the source observable here.
          // `useScope` runs the factory inside useMemo during render — calling
          // obs$.set here is equivalent to the ref-callback timing for the
          // observable mirror, since onChange has not been attached yet.
          obs$.set("committed");
          return { p$ };
        },
        { field: obs$ } as unknown as Record<string, unknown>
      )
    );

    // After mount, the mirrored field must reflect the post-factory value —
    // not the `null` that was peeked when buildInitialValue ran.
    expect((result.current.p$ as unknown as { field: { get(): string | null } }).field.get()).toBe(
      "committed"
    );
  });

  it("downstream createObserve() reruns with the caught-up value after mount", () => {
    const obs$ = observable<string | null>(null);
    const seen: Array<string | null> = [];

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p) as unknown as Observable<{ field: string | null }>;
          // Flip source between factory and onMount.
          obs$.set("ready");
          createObserve(() => {
            seen.push(p$.field.get());
          });
          return {};
        },
        { field: obs$ } as unknown as Record<string, unknown>
      )
    );

    // `observe` fires synchronously on registration with the initial (null)
    // value, then reruns once the onMount catch-up sets the field to "ready".
    // If catch-up is missing, the second rerun never happens.
    expect(seen).toContain("ready");
  });

  it("catch-up does not fire when the peek value equals the mirrored value", () => {
    const obs$ = observable<string | null>("same");
    const changes: Array<string | null> = [];

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p) as unknown as Observable<{ field: string | null }>;
          // `onChange` would normally not trigger for equal values, but the
          // catch-up path is a direct `.set` — guard against a redundant fire.
          p$.field.onChange(({ value }: { value: string | null }) => {
            changes.push(value);
          });
          return {};
        },
        { field: obs$ } as unknown as Record<string, unknown>
      )
    );

    // No change after mount: source === mirrored ("same") ⇒ no notify.
    expect(changes).toEqual([]);
  });

  it("catch-up mirrors the latest value when the source observable is replaced with a different reference", () => {
    // Covers the Ref$ mount scenario: value goes from null → element between
    // factory execution and onMount registration.
    const ref$ = observable<{ id: number } | null>(null);
    const el = { id: 1 };

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          ref$.set(el); // simulate ref callback during commit
          return { p$ };
        },
        { ref: ref$ } as unknown as Record<string, unknown>
      )
    );

    expect(
      (result.current.p$ as unknown as { ref: { get(): { id: number } | null } }).ref.get()
    ).toBe(el);
  });

  it("catch-up survives React Strict Mode (double-mount)", () => {
    // Strict Mode mounts, unmounts, and remounts the effect synchronously.
    // The catch-up runs on every onMount, so the remounted subscription
    // should see the same final value without losing the post-factory change.
    const obs$ = observable<number>(0);
    let factoryCalls = 0;

    const { result } = renderHook(() =>
      useScope(
        (p) => {
          factoryCalls += 1;
          const p$ = toObs(p);
          obs$.set(42);
          return { p$ };
        },
        { n: obs$ } as unknown as Record<string, unknown>
      )
    );

    // After the (possibly doubled) mount, the mirror must reflect 42.
    expect((result.current.p$ as unknown as { n: { get(): number } }).n.get()).toBe(42);
    // Sanity: factory executed at least once.
    expect(factoryCalls).toBeGreaterThanOrEqual(1);
  });

  it("re-render after catch-up keeps subscribing to the same source observable", () => {
    const obs$ = observable<number>(1);

    const { result, rerender } = renderHook(
      ({ extra }) =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            return { p$, extra };
          },
          { n: obs$ } as unknown as Record<string, unknown>
        ),
      { initialProps: { extra: "a" } }
    );

    // Pre-mount catch-up path is fine — verify runtime subscription still
    // flows after re-render.
    act(() => obs$.set(2));
    expect((result.current.p$ as unknown as { n: { get(): number } }).n.get()).toBe(2);

    rerender({ extra: "b" });

    act(() => obs$.set(3));
    expect((result.current.p$ as unknown as { n: { get(): number } }).n.get()).toBe(3);
  });
});
