// @vitest-environment jsdom
import { render, renderHook, act } from "@testing-library/react";
import { useObserve } from "@legendapp/state/react";
import { createElement, createRef, forwardRef, useImperativeHandle, useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { useRef$, peekElement } from ".";

interface TestHandle {
  focus: () => void;
  getValue: () => string;
}

/**
 * useRef$() + useImperativeHandle compatibility tests
 *
 * Scenarios:
 *  1. Component exposes custom handle to parent via useImperativeHandle
 *     while using useRef$ internally for reactive DOM tracking
 *  2. Parent ref receives the custom handle (not the raw DOM element)
 *  3. el$ reactivity is unaffected by useImperativeHandle updates
 *  4. Ref$ itself can serve as the ref argument in useImperativeHandle
 *     (Ref$ observes the imperative handle object)
 *  5. Cleanup: parent ref is nulled on unmount (React default behaviour)
 *
 * [Parent → Child] Scenarios:
 *  7. Parent creates Ref$ and passes it as ref to a child that uses useImperativeHandle
 *     — Ref$ stores the handle object, not a DOM element
 *  8. Ref$ reactivity fires when the child mounts (handle assigned) and unmounts (null)
 *  9. Ref$ passed as ref to multiple children sequentially — updates correctly each time
 */
describe("useRef$() + useImperativeHandle compatibility", () => {
  // ─── Scenario 1 ───────────────────────────────────────────────────────────
  it("exposes custom handle to parent while el$ tracks the DOM element internally", () => {
    const focusSpy = vi.fn();

    const Component = forwardRef<TestHandle, object>((_, ref) => {
      const el$ = useRef$<HTMLDivElement>();

      useImperativeHandle(ref, () => ({
        focus: () => {
          const el = peekElement(el$) as HTMLDivElement | null;
          el?.focus?.();
          focusSpy();
        },
        getValue: () => "test-value",
      }));

      return createElement("div", { ref: el$, tabIndex: 0 });
    });

    const parentRef = createRef<TestHandle>();
    render(createElement(Component, { ref: parentRef }));

    // Parent ref has the custom handle object
    expect(parentRef.current).not.toBeNull();
    expect(typeof parentRef.current?.focus).toBe("function");
    expect(typeof parentRef.current?.getValue).toBe("function");
    expect(parentRef.current?.getValue()).toBe("test-value");

    // Custom handle methods can reach the real DOM via peekElement
    act(() => {
      parentRef.current?.focus();
    });
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  // ─── Scenario 2 ───────────────────────────────────────────────────────────
  it("parent ref holds the handle object — not the raw DOM element", () => {
    let capturedRef$: ReturnType<typeof useRef$<HTMLDivElement>> | null = null;

    const Component = forwardRef<TestHandle, object>((_, ref) => {
      const el$ = useRef$<HTMLDivElement>();
      capturedRef$ = el$;

      useImperativeHandle(ref, () => ({
        focus: () => {},
        getValue: () => "value",
      }));

      return createElement("div", { ref: el$ });
    });

    const parentRef = createRef<TestHandle>();
    render(createElement(Component, { ref: parentRef }));

    // Parent ref must NOT be an HTMLElement
    expect(parentRef.current).not.toBeInstanceOf(HTMLElement);
    expect(typeof parentRef.current?.focus).toBe("function");

    // el$ must hold the actual DOM element
    const element = peekElement(capturedRef$!);
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  // ─── Scenario 3 ───────────────────────────────────────────────────────────
  it("el$ reactivity fires independently of useImperativeHandle dep changes", () => {
    const observeSpy = vi.fn();

    const Component = forwardRef<TestHandle, { value: string }>(({ value }, ref) => {
      const el$ = useRef$<HTMLDivElement>();

      useImperativeHandle(
        ref,
        () => ({
          focus: () => {},
          getValue: () => value,
        }),
        [value],
      );

      useObserve(() => {
        el$.get(); // register tracking
        observeSpy();
      });

      return createElement("div", { ref: el$ });
    });

    const parentRef = createRef<TestHandle>();
    const { rerender } = render(
      createElement(Component, { ref: parentRef, value: "initial" }),
    );

    // After initial render: observer fires once (null) + once (DOM assigned)
    const callsAfterMount = observeSpy.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Trigger useImperativeHandle re-creation via dep change (value changes)
    act(() => {
      rerender(createElement(Component, { ref: parentRef, value: "updated" }));
    });

    // el$ observable did NOT change → observer must NOT fire again
    expect(observeSpy.mock.calls.length).toBe(callsAfterMount);

    // But the handle's getValue reflects the new value
    expect(parentRef.current?.getValue()).toBe("updated");
  });

  // ─── Scenario 4 ───────────────────────────────────────────────────────────
  it("Ref$ can serve as the ref argument in useImperativeHandle to observe the handle", () => {
    // Ref$ is typed as Ref<T> (callback-ref compatible), so it can be passed
    // directly to useImperativeHandle.  React will call el$(handleObject).
    const handle$ = (() => {
      let ref: ReturnType<typeof useRef$<any>>;
      renderHook(() => {
        ref = useRef$<any>();
      });
      return ref!;
    })();

    // Mimic what React does internally when useImperativeHandle fires:
    // it calls the ref callback with the constructed handle object.
    const mockHandle = { focus: vi.fn(), getValue: () => "from-handle" };
    act(() => {
      handle$(mockHandle as any);
    });

    // Ref$ should have stored the handle via OpaqueObject wrapping
    expect(handle$.peek()).not.toBeNull();
    // valueOf() on the OpaqueObject returns the original object
    expect((handle$.peek() as any).valueOf()).toBe(mockHandle);
  });

  // ─── Scenario 5 ───────────────────────────────────────────────────────────
  it("useRef$ and useRef can coexist with useImperativeHandle on the same component", () => {
    const observeSpy = vi.fn();

    const Component = forwardRef<TestHandle, object>((_, ref) => {
      // useRef for DOM — useRef$ wraps it for reactivity
      const domRef = useRef<HTMLDivElement>(null);
      const el$ = useRef$<HTMLDivElement>(domRef);

      useImperativeHandle(ref, () => ({
        focus: () => domRef.current?.focus(),
        getValue: () => "shared-ref",
      }));

      useObserve(() => {
        el$.get();
        observeSpy();
      });

      return createElement("div", { ref: el$ });
    });

    const parentRef = createRef<TestHandle>();
    render(createElement(Component, { ref: parentRef }));

    // Observer fires: initial (null) + DOM assigned
    expect(observeSpy).toHaveBeenCalledTimes(2);
    expect(parentRef.current?.getValue()).toBe("shared-ref");
  });

  // ─── Scenario 6 ───────────────────────────────────────────────────────────
  it("parent ref is nulled on unmount (standard React useImperativeHandle cleanup)", () => {
    const Component = forwardRef<TestHandle, object>((_, ref) => {
      const el$ = useRef$<HTMLDivElement>();

      useImperativeHandle(ref, () => ({
        focus: () => {},
        getValue: () => "value",
      }));

      return createElement("div", { ref: el$ });
    });

    const parentRef = createRef<TestHandle>();
    const { unmount } = render(createElement(Component, { ref: parentRef }));

    expect(parentRef.current).not.toBeNull();

    act(() => {
      unmount();
    });

    expect(parentRef.current).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// [Parent → Child] 부모가 Ref$를 자식의 ref로 넘기는 시나리오
// ═══════════════════════════════════════════════════════════════════════════════

describe("useRef$() as parent ref passed to child with useImperativeHandle", () => {
  // Child component used across all parent→child tests
  const Child = forwardRef<TestHandle, { value?: string }>((props, ref) => {
    useImperativeHandle(ref, () => ({
      focus: vi.fn(),
      getValue: () => props.value ?? "default",
    }));
    return createElement("div");
  });

  // ─── Scenario 7 ─────────────────────────────────────────────────────────
  it("Ref$ stores the handle object when passed as ref to a child using useImperativeHandle", () => {
    // useRef$<any>: Ref$ is intentionally used to store a non-Element handle object
    const { result } = renderHook(() => useRef$<any>());
    const handle$ = result.current;

    // Render child with Ref$ as ref — useImperativeHandle will call handle$(handleObj)
    render(createElement(Child, { ref: handle$ as any }));

    const raw = handle$.peek();
    expect(raw).not.toBeNull();

    // valueOf() unwraps the OpaqueObject → the actual handle object
    const handle = (raw as any).valueOf() as TestHandle;
    expect(typeof handle.focus).toBe("function");
    expect(handle.getValue()).toBe("default");
  });

  // ─── Scenario 8 ─────────────────────────────────────────────────────────
  it("Ref$ reactivity fires on child mount (handle assigned) and child unmount (null)", () => {
    const observeSpy = vi.fn();

    const { result } = renderHook(() => {
      const handle$ = useRef$<any>();
      useObserve(() => {
        handle$.get();
        observeSpy();
      });
      return handle$;
    });

    // Initial observer run (handle = null)
    expect(observeSpy).toHaveBeenCalledTimes(1);

    // Mount child → useImperativeHandle assigns handle to Ref$
    const { unmount } = render(
      createElement(Child, { ref: result.current as any }),
    );

    // Observer must fire again (handle assigned)
    expect(observeSpy).toHaveBeenCalledTimes(2);

    // Unmount child → React calls ref(null) → Ref$ resets to null
    act(() => {
      unmount();
    });

    // Observer must fire again (handle cleared)
    expect(observeSpy).toHaveBeenCalledTimes(3);
    expect(result.current.peek()).toBeNull();
  });

  // ─── Scenario 9 ─────────────────────────────────────────────────────────
  it("Ref$ updates correctly when the child re-renders with new useImperativeHandle deps", () => {
    const { result } = renderHook(() => useRef$<any>());
    const handle$ = result.current;

    const { rerender } = render(
      createElement(Child, { ref: handle$ as any, value: "v1" }),
    );

    expect((handle$.peek() as any).valueOf().getValue()).toBe("v1");

    // Re-render with new value → useImperativeHandle recreates the handle
    act(() => {
      rerender(createElement(Child, { ref: handle$ as any, value: "v2" }));
    });

    expect((handle$.peek() as any).valueOf().getValue()).toBe("v2");
  });

  // ─── Scenario 10 ────────────────────────────────────────────────────────
  it("Ref$ switches between two different children sequentially", () => {
    const ChildA = forwardRef<{ id: string }, object>((_, ref) => {
      useImperativeHandle(ref, () => ({ id: "A" }));
      return createElement("div");
    });

    const ChildB = forwardRef<{ id: string }, object>((_, ref) => {
      useImperativeHandle(ref, () => ({ id: "B" }));
      return createElement("div");
    });

    const { result } = renderHook(() => useRef$<any>());
    const handle$ = result.current;

    // Mount ChildA
    const { unmount: unmountA } = render(
      createElement(ChildA, { ref: handle$ as any }),
    );
    expect((handle$.peek() as any).valueOf().id).toBe("A");

    act(() => unmountA());
    expect(handle$.peek()).toBeNull();

    // Mount ChildB
    const { unmount: unmountB } = render(
      createElement(ChildB, { ref: handle$ as any }),
    );
    expect((handle$.peek() as any).valueOf().id).toBe("B");

    act(() => unmountB());
    expect(handle$.peek()).toBeNull();
  });
});
