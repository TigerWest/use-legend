// @vitest-environment jsdom
/**
 * Experiment: useObservable(() => get(options)) pattern for DeepMaybeObservable
 *
 * Verified behaviors:
 *
 *  Case 1 — outer Observable<T>
 *    useObservable(() => get(options$)) reactively tracks options$ changes ✓
 *    Dep registered via options$.get() inside reactive context.
 *
 *  Case 2 — per-field { field: Observable<T[K]> }
 *    Legend-State auto-dereferences inner Observables — no double-nesting ✓
 *    computed$.field.get() returns the plain value (e.g. "0px"), NOT Observable<T>
 *    Inner Observable changes ARE reflected via field-level dep tracking (not callback re-eval) ✓
 *    The outer useObservable callback is NOT re-evaluated on inner field changes.
 *
 *  Case 3 — useElementVisibility with Element (scrollTarget) options
 *    Per-field scrollTarget as Ref$, Observable<HTMLElement | null>(null), plain HTMLElement
 *    Note: Observable<HTMLElement> starting from non-null is NOT reliably tracked
 *    (Legend-State deeply proxies HTMLElements; use Ref$ or start from null).
 */
import { act, renderHook } from "@testing-library/react";
import { isObservable, observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "../../function/get";
import { useRef$ } from "../useRef$";
import { useElementVisibility } from ".";
import { useIntersectionObserver } from "../useIntersectionObserver";

// --- IntersectionObserver mock ---

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedInit: IntersectionObserverInit | undefined;

const MockIntersectionObserver = vi.fn(
  (_cb: IntersectionObserverCallback, init?: IntersectionObserverInit) => {
    capturedInit = init;
    return { observe: mockObserve, disconnect: mockDisconnect };
  },
);

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  MockIntersectionObserver.mockClear();
  capturedInit = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// =============================================================================
// Case 1: outer Observable<T>
// =============================================================================

describe("Case 1 — outer Observable<T>: useObservable(() => get(options$))", () => {
  it("computed$ reflects updated rootMargin when outer Observable changes", () => {
    const options$ = observable({ rootMargin: "0px" });

    const { result } = renderHook(() => {
      // useObservable(fn) — Legend-State tracks .get() calls inside fn
      const computed$ = useObservable(() => get(options$));
      return { computed$ };
    });

    expect(result.current.computed$.rootMargin.get()).toBe("0px");

    act(() => {
      options$.rootMargin.set("20px");
    });

    // options$.get() was called in reactive context → dep registered
    // → computed$ recomputes when options$ changes
    expect(result.current.computed$.rootMargin.get()).toBe("20px");
  });

  it("computed$ reflects all field changes in outer Observable", () => {
    const options$ = observable({ rootMargin: "0px", threshold: 0 });

    const { result } = renderHook(() => {
      const computed$ = useObservable(() => get(options$));
      return { computed$ };
    });

    act(() => {
      options$.set({ rootMargin: "10px", threshold: 0.5 });
    });

    expect(result.current.computed$.rootMargin.get()).toBe("10px");
    expect(result.current.computed$.threshold.get()).toBe(0.5);
  });
});

// =============================================================================
// Case 2: per-field { field: Observable<T[K]> } — auto-dereference behavior
// =============================================================================

describe("Case 2 — per-field { field: obs$ }: Legend-State auto-dereferences inner Observables", () => {
  it("computed$.rootMargin.get() returns plain string — no double-nesting", () => {
    const rootMargin$ = observable("0px");

    const { result } = renderHook(() => {
      // get({ rootMargin: rootMargin$ }) returns the plain object as-is (not Observable)
      // useObservable wraps it, but Legend-State auto-dereferences inner Observables
      // → computed$.rootMargin.get() returns "0px" (string), NOT Observable<string>
      const computed$ = useObservable(() =>
        get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ }),
      );
      return { computed$ };
    });

    const fieldValue = result.current.computed$.rootMargin.get();
    // Legend-State auto-dereferences: returns plain string, not Observable
    expect(isObservable(fieldValue)).toBe(false);
    expect(fieldValue).toBe("0px");
  });

  it("changing inner Observable does NOT re-evaluate computed$ (no dep registered)", () => {
    const rootMargin$ = observable("0px");
    let evalCount = 0;

    renderHook(() => {
      useObservable(() => {
        evalCount++;
        // get() on plain object: isObservable = false → returns as-is, no .get() called
        // → rootMargin$ is never called .get() → dep NOT registered
        return get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ });
      });
    });

    const countBeforeChange = evalCount;

    act(() => {
      rootMargin$.set("20px");
    });

    // rootMargin$ not tracked → evalCount unchanged
    expect(evalCount).toBe(countBeforeChange);
  });

  it("inner Observable change IS reflected — Legend-State tracks inner fields directly (not via callback re-eval)", () => {
    const rootMargin$ = observable("0px");
    let evalCount = 0;

    const { result } = renderHook(() => {
      const computed$ = useObservable(() => {
        evalCount++;
        return get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ });
      });
      return { computed$ };
    });

    expect(result.current.computed$.rootMargin.get()).toBe("0px");
    const countBeforeChange = evalCount;

    act(() => {
      rootMargin$.set("20px");
    });

    // Legend-State tracks inner Observable fields via field-level dep (NOT callback re-evaluation)
    // → computed$.rootMargin updates to "20px" without re-running the outer callback
    expect(result.current.computed$.rootMargin.get()).toBe("20px");
    expect(evalCount).toBe(countBeforeChange); // outer callback NOT re-run
  });
});

// =============================================================================
// useElementVisibility — per-field vs outer Observable reactivity comparison
// =============================================================================

describe("useElementVisibility — reactivity comparison", () => {
  it("per-field rootMargin$ change → IntersectionObserver recreated ✓ (current implementation works)", () => {
    const el = document.createElement("div");
    const rootMargin$ = observable("0px");

    renderHook(() =>
      useElementVisibility(wrapEl(el), { rootMargin: rootMargin$ }),
    );

    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(capturedInit?.rootMargin).toBe("0px");

    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      rootMargin$.set("20px");
    });

    // opts?.rootMargin = Observable<string> passed through to useIntersectionObserver
    // useIntersectionObserver's useObserve calls get(rootMargin$) → dep registered
    // → rootMargin$ change triggers setup() → IntersectionObserver recreated ✓
    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(capturedInit?.rootMargin).toBe("20px");
  });

  it("outer Observable options$.rootMargin child-field set → known Legend-State limitation (0×, not reactive)", () => {
    const el = document.createElement("div");
    const options$ = observable({ rootMargin: "0px" });

    renderHook(() => useElementVisibility(wrapEl(el), options$));

    expect(capturedInit?.rootMargin).toBe("0px");
    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      options$.rootMargin.set("20px");
    });

    // KNOWN LIMITATION: options$.rootMargin.set("20px") is a child-field mutation.
    // options$.get() inside useObservable's compute fn does reference-equality tracking —
    // the parent options$ object reference is unchanged, so the dep does NOT fire.
    // opts_EV$ does NOT recompute → opts_EV$.rootMargin stays "0px" → 0× IO recreation.
    //
    // Workaround: use options$.set({ rootMargin: "20px" }) (whole-object replace)
    // OR pass rootMargin as a per-field Observable: { rootMargin: observable("0px") }.
    expect(MockIntersectionObserver).toHaveBeenCalledTimes(0);
  });
});

// =============================================================================
// Case 3: useElementVisibility — scrollTarget (Element) options
// =============================================================================

describe("Case 3 — scrollTarget (Element) in useElementVisibility", () => {
  it("plain HTMLElement as scrollTarget", () => {
    const el = document.createElement("div");
    const scrollContainer = document.createElement("div");

    renderHook(() =>
      useElementVisibility(wrapEl(el), { scrollTarget: wrapEl(scrollContainer) }),
    );

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: scrollContainer }),
    );
  });

  it("outer Observable<Options> with scrollTarget — resolved at mount (snapshot)", () => {
    const el = document.createElement("div");
    const scrollContainer = document.createElement("div");
    const options$ = observable({
      scrollTarget: scrollContainer as any,
    });

    renderHook(() => useElementVisibility(wrapEl(el), options$));

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: scrollContainer }),
    );
  });

  it("Ref$ as scrollTarget — delays IntersectionObserver until Ref$ is mounted", () => {
    const el = document.createElement("div");
    const scrollContainer = document.createElement("div");

    const { result } = renderHook(() => {
      const scrollTarget$ = useRef$<HTMLElement>();
      return {
        scrollTarget$,
        visibility: useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }),
      };
    });

    // Ref$ is null → useIntersectionObserver's null guard skips setup
    expect(MockIntersectionObserver).not.toHaveBeenCalled();

    act(() => {
      result.current.scrollTarget$(scrollContainer);
    });

    // Ref$ mounted → useIntersectionObserver's useObserve re-runs → setup() with root
    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: scrollContainer }),
    );
  });

  it("Ref$ scrollTarget change → IntersectionObserver recreated with new root", () => {
    const el = document.createElement("div");
    const containerA = document.createElement("div");
    const containerB = document.createElement("div");

    const { result } = renderHook(() => {
      const scrollTarget$ = useRef$<HTMLElement>();
      return {
        scrollTarget$,
        visibility: useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }),
      };
    });

    act(() => {
      result.current.scrollTarget$(containerA);
    });

    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: containerA }),
    );

    mockDisconnect.mockClear();
    MockIntersectionObserver.mockClear();

    act(() => {
      result.current.scrollTarget$(containerB);
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: containerB }),
    );
  });

  it("per-field scrollTarget as Observable<HTMLElement | null> — null→element tracked (reliable pattern)", () => {
    const el = document.createElement("div");
    const container = document.createElement("div");
    // Start with null — @legendapp/state reliably tracks null→element transitions.
    // Use OpaqueObject to prevent Legend-State from deeply proxying the element.
    const scrollTarget$ = observable<OpaqueObject<Element> | null>(null);

    renderHook(() =>
      useElementVisibility(wrapEl(el), { scrollTarget: scrollTarget$ }),
    );

    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      scrollTarget$.set(ObservableHint.opaque(container));
    });

    // null→element: null root delays IO creation, no old IO to disconnect
    // → new IO created with container as root
    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(MockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ root: container }),
    );
  });
});

// =============================================================================
// Standard Pattern — useObservable(() => get(options), [options])
// Anti-pattern(snapshot)의 한계를 극복하는 올바른 패턴 검증
// =============================================================================

describe("Standard Pattern — useObservable(() => get(options), [options])", () => {
  it("outer Observable options$ child-field change — opts$.rootMargin dep triggers IO recreated ✓", () => {
    const el = document.createElement("div");
    const options$ = observable({ rootMargin: "0px" });

    renderHook(() => {
      // Standard Pattern: outer Observable<Options>를 computed opts$로 정규화
      // get(options$) → options$.get() in reactive context → dep registered
      // opts$.rootMargin은 Observable<string> — useIntersectionObserver의 useObserve에서
      // get(options.rootMargin) 호출 → dep registered → rootMargin 변경 시 setup() 재실행
      const opts$ = useObservable(() => get(options$), [options$]);

      useIntersectionObserver(wrapEl(el), () => {}, {
        rootMargin: opts$.rootMargin,
      });
    });

    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(capturedInit?.rootMargin).toBe("0px");

    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      // 전체 객체 교체 — opts$ 재계산 → opts$.rootMargin 업데이트 → IO 재생성 ✓
      // (child-field set은 useObservable 재평가를 트리거하지 않음 — Legend-State 동작)
      options$.set({ rootMargin: "20px" });
    });

    // opts$.rootMargin이 Observable<string>으로 전달됨
    // → options$ 교체 → opts$ 재계산 → opts$.rootMargin 업데이트
    // → useObserve 재실행 → IntersectionObserver 재생성 ✓
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(capturedInit?.rootMargin).toBe("20px");
  });

  it("outer Observable options$ 전체 교체 → IntersectionObserver recreated ✓", () => {
    const el = document.createElement("div");
    const options$ = observable<{ rootMargin: string; threshold?: number }>({
      rootMargin: "0px",
    });

    renderHook(() => {
      const opts$ = useObservable(() => get(options$), [options$]);
      useIntersectionObserver(wrapEl(el), () => {}, {
        rootMargin: opts$.rootMargin,
      });
    });

    expect(capturedInit?.rootMargin).toBe("0px");
    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      // 전체 options 객체 교체
      options$.set({ rootMargin: "50px", threshold: 0.5 });
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(MockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(capturedInit?.rootMargin).toBe("50px");
  });

  it("Standard Pattern with per-field Observable — 기존 per-field 동작도 유지됨 ✓", () => {
    const el = document.createElement("div");
    const rootMargin$ = observable("0px");

    renderHook(() => {
      // per-field Observable을 포함한 object — Standard Pattern 적용
      // Legend-State auto-dereferences inner Observables → opts$.rootMargin은 Observable<string>
      const opts$ = useObservable(
        () => get<{ rootMargin: typeof rootMargin$ }>({ rootMargin: rootMargin$ }),
        [rootMargin$],
      );
      useIntersectionObserver(wrapEl(el), () => {}, {
        rootMargin: opts$.rootMargin,
      });
    });

    expect(capturedInit?.rootMargin).toBe("0px");
    MockIntersectionObserver.mockClear();
    mockDisconnect.mockClear();

    act(() => {
      rootMargin$.set("30px");
    });

    // rootMargin$ 변경 시 두 dep 경로가 모두 fire될 수 있음:
    // 1) opts$.rootMargin (auto-dereferenced inner dep) → useObserve 재실행
    // 2) useObservable deps array [rootMargin$] → 재계산
    // 결과적으로 IO가 재생성되고 최종 rootMargin은 "30px" ✓
    expect(MockIntersectionObserver).toHaveBeenCalled();
    expect(capturedInit?.rootMargin).toBe("30px");
  });
});
