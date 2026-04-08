// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useScope, toObs, observe } from ".";

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
    it("observe(() => obs$.count.get()) fires when count changes", () => {
      const spy = vi.fn();
      const { rerender } = renderHook(
        ({ count }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p);
              observe(() => spy(obs$.count.get()));
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
              observe(() => countSpy(obs$.count.get()));
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
              observe(() => countSpy(obs$.count.get()));
              observe(() => nameSpy(obs$.name.get()));
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
              observe(() => spy(obs$.a.get(), obs$.b.get(), obs$.c.get()));
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

  describe("toObs with hints", () => {
    it("toObs(p, { onClick: 'function' }) — function prop changes detected", () => {
      const spy = vi.fn();
      const fn1 = () => "first";
      const fn2 = () => "second";

      const { rerender } = renderHook(
        ({ onClick }) =>
          useScope(
            (p) => {
              const obs$ = toObs(p, { onClick: "function" });
              observe(() => {
                const fn = obs$.onClick.get();
                spy(fn);
              });
              return {};
            },
            { onClick }
          ),
        { initialProps: { onClick: fn1 } }
      );

      expect(spy).toHaveBeenCalledTimes(1);

      rerender({ onClick: fn2 });
      expect(spy).toHaveBeenCalledTimes(2);
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
            observe(() => {
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

  it("toObs(p, 'function') wraps entire props with function hint", () => {
    const fn1 = () => "a";
    const fn2 = () => "b";
    const spy = vi.fn();

    const { rerender } = renderHook(
      ({ onClick, onHover }) =>
        useScope(
          (p) => {
            const obs$ = toObs(p, "function");
            observe(() => spy(obs$.onClick.get(), obs$.onHover.get()));
            return {};
          },
          { onClick, onHover }
        ),
      { initialProps: { onClick: fn1, onHover: fn2 } }
    );

    expect(spy).toHaveBeenCalledTimes(1);

    const fn3 = () => "c";
    rerender({ onClick: fn3, onHover: fn2 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("toObs(p, { field: hint }) per-field hint still works", () => {
    // 기존 per-field hint 하위 호환 확인
    const spy = vi.fn();
    renderHook(
      ({ dump }) =>
        useScope(
          (p) => {
            const obs$ = toObs(p, { dump: "function" });
            observe(() => spy(obs$.dump.get()));
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
            observe(() => spy(t$.debounce.get(), o$.name.get()));
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

  it("observe() on toObs(p).obs fires when the Observable field value changes", () => {
    const source$ = observable(0);
    const spy = vi.fn();

    renderHook(() =>
      useScope(
        (p) => {
          const p$ = toObs(p);
          observe(() => spy(p$.obs.get()));
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
});

describe("useScope() — reactiveProps plain state selectivity", () => {
  it("same-value rerender does not trigger observe (Object.is guard)", () => {
    const spy = vi.fn();
    const { rerender } = renderHook(
      ({ count }) =>
        useScope(
          (p) => {
            const p$ = toObs(p);
            observe(() => spy(p$.count.get()));
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
            observe(() => spyA(p$.a.get())); // only tracking 'a'
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
          observe(() => spy(p$.count.get()));
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
          observe(() => spy(p$.count.get())); // only observing count
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
