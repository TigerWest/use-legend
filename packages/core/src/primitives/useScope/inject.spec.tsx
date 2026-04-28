// @vitest-environment jsdom
import React from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { observable } from "@legendapp/state";
import { inject } from "./inject";
import { useScope, onMount } from "./index";
import { createObserve } from "./observe";

describe("inject()", () => {
  describe("error paths", () => {
    it("throws when called outside an active recorder", () => {
      const Ctx = React.createContext<number>(0);
      expect(() => inject(Ctx)).toThrow(/inject\(\) must be called inside useScope factory/);
    });
  });
});

describe("inject() — inside useScope", () => {
  it("returns the Context value when rendered under a Provider", () => {
    const Ctx = React.createContext<{ label: string }>({ label: "default" });
    const captured: { label: string }[] = [];

    function Child() {
      useScope(() => {
        captured.push(inject(Ctx));
        return {};
      });
      return null;
    }

    render(
      <Ctx.Provider value={{ label: "from-provider" }}>
        <Child />
      </Ctx.Provider>
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual({ label: "from-provider" });
  });
});

describe("inject() — reactive propagation", () => {
  it("re-renders useScope component when Context value changes (identity swap)", () => {
    const Ctx = React.createContext<{ n: number }>({ n: 0 });
    let renderCount = 0;

    function Child() {
      renderCount++;
      const val = useScope(() => {
        const v = inject(Ctx);
        return { v };
      });
      return <span data-testid="v">{val.v.n}</span>;
    }

    function Parent() {
      const [n, setN] = React.useState(1);
      return (
        <Ctx.Provider value={{ n }}>
          <button data-testid="bump" onClick={() => setN((x) => x + 1)} />
          <Child />
        </Ctx.Provider>
      );
    }

    const { getByTestId } = render(<Parent />);
    const initialRenders = renderCount;
    expect(getByTestId("v").textContent).toBe("1");

    act(() => {
      getByTestId("bump").click();
    });

    expect(renderCount).toBeGreaterThan(initialRenders);
  });

  it("createObserve() inside scope reacts when Provider value is an Observable (stable ref)", () => {
    const counter$ = observable({ n: 1 });
    const Ctx = React.createContext(counter$);
    const seen: number[] = [];

    function Child() {
      useScope(() => {
        const c$ = inject(Ctx);
        createObserve(() => {
          seen.push(c$.n.get());
        });
        return {};
      });
      return null;
    }

    render(
      <Ctx.Provider value={counter$}>
        <Child />
      </Ctx.Provider>
    );

    expect(seen).toEqual([1]);

    act(() => {
      counter$.n.set(2);
    });

    expect(seen).toEqual([1, 2]);
  });
});

describe("inject() — async / post-factory calls", () => {
  it("throws when called from a setTimeout inside the factory (recorder torn down)", async () => {
    const Ctx = React.createContext<number>(0);
    let captured: unknown = null;

    function Child() {
      useScope(() => {
        setTimeout(() => {
          try {
            inject(Ctx);
          } catch (e) {
            captured = e;
          }
        }, 0);
        return {};
      });
      return null;
    }

    render(
      <Ctx.Provider value={1}>
        <Child />
      </Ctx.Provider>
    );

    await new Promise((r) => setTimeout(r, 5));
    expect(captured).toBeInstanceOf(Error);
    expect((captured as Error).message).toMatch(/must be called inside useScope factory/);
  });

  it("throws when called from onMount (recorder already torn down)", () => {
    const Ctx = React.createContext<number>(0);
    let captured: unknown = null;

    function Child() {
      useScope(() => {
        onMount(() => {
          try {
            inject(Ctx);
          } catch (e) {
            captured = e;
          }
        });
        return {};
      });
      return null;
    }

    render(
      <Ctx.Provider value={1}>
        <Child />
      </Ctx.Provider>
    );

    expect(captured).toBeInstanceOf(Error);
  });
});

describe("inject() — multi-context order", () => {
  it("preserves the order of recorded contexts across re-renders (no hook-order warning)", () => {
    const A = React.createContext(1);
    const B = React.createContext("b");
    const C = React.createContext(true);

    const seen: Array<[number, string, boolean]> = [];

    function Child() {
      const r = useScope(() => {
        const a = inject(A);
        const b = inject(B);
        const c = inject(C);
        return { a, b, c };
      });
      seen.push([r.a, r.b, r.c]);
      return null;
    }

    function Parent() {
      const [n, setN] = React.useState(0);
      return (
        <A.Provider value={1}>
          <B.Provider value={"b" + n}>
            <C.Provider value={n % 2 === 0}>
              <button data-testid="bump" onClick={() => setN((x) => x + 1)} />
              <Child />
            </C.Provider>
          </B.Provider>
        </A.Provider>
      );
    }

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByTestId } = render(<Parent />);

    act(() => {
      getByTestId("bump").click();
    });
    act(() => {
      getByTestId("bump").click();
    });

    const hookOrderWarnings = errorSpy.mock.calls.filter((call) =>
      String(call[0] ?? "").includes("hooks")
    );
    expect(hookOrderWarnings).toHaveLength(0);
    errorSpy.mockRestore();

    expect(seen[0]).toEqual([1, "b0", true]);
  });
});

describe("inject() — conditional on first mount", () => {
  it("only records contexts actually inject()'d during first mount", () => {
    const A = React.createContext(1);
    const B = React.createContext(2);

    function Child({ takeB }: { takeB: boolean }) {
      useScope(() => {
        inject(A);
        if (takeB) inject(B);
        return {};
      });
      return null;
    }

    const { rerender } = render(<Child takeB={false} />);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    rerender(<Child takeB={true} />);
    rerender(<Child takeB={false} />);
    const hookOrderWarnings = errorSpy.mock.calls.filter((call) =>
      String(call[0] ?? "").includes("hooks")
    );
    expect(hookOrderWarnings).toHaveLength(0);
    errorSpy.mockRestore();
  });
});

describe("inject() — Strict Mode", () => {
  it("records contexts exactly once across strict-mode double mount", () => {
    const Ctx = React.createContext<number>(0);
    const factory = vi.fn(() => {
      inject(Ctx);
      return {};
    });

    function Child() {
      useScope(factory);
      return null;
    }

    render(
      <React.StrictMode>
        <Ctx.Provider value={42}>
          <Child />
        </Ctx.Provider>
      </React.StrictMode>
    );

    expect(factory).toHaveBeenCalledTimes(1);
  });
});
