// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useScroll } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function makeEl(
  overrides: Partial<{
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  }> = {},
): HTMLDivElement {
  const el = document.createElement("div");
  const {
    scrollLeft = 0,
    scrollTop = 0,
    scrollWidth = 500,
    scrollHeight = 1000,
    clientWidth = 300,
    clientHeight = 400,
  } = overrides;
  Object.defineProperties(el, {
    scrollLeft: { writable: true, configurable: true, value: scrollLeft },
    scrollTop: { writable: true, configurable: true, value: scrollTop },
    scrollWidth: { writable: true, configurable: true, value: scrollWidth },
    scrollHeight: { writable: true, configurable: true, value: scrollHeight },
    clientWidth: { writable: true, configurable: true, value: clientWidth },
    clientHeight: { writable: true, configurable: true, value: clientHeight },
  });
  return el;
}

function setWindowDimensions(opts: {
  scrollX?: number;
  scrollY?: number;
  innerWidth?: number;
  innerHeight?: number;
  docScrollWidth?: number;
  docScrollHeight?: number;
}) {
  if (opts.scrollX !== undefined)
    Object.defineProperty(window, "scrollX", {
      writable: true,
      configurable: true,
      value: opts.scrollX,
    });
  if (opts.scrollY !== undefined)
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: opts.scrollY,
    });
  if (opts.innerWidth !== undefined)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: opts.innerWidth,
    });
  if (opts.innerHeight !== undefined)
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: opts.innerHeight,
    });
  if (opts.docScrollWidth !== undefined)
    Object.defineProperty(document.documentElement, "scrollWidth", {
      writable: true,
      configurable: true,
      value: opts.docScrollWidth,
    });
  if (opts.docScrollHeight !== undefined)
    Object.defineProperty(document.documentElement, "scrollHeight", {
      writable: true,
      configurable: true,
      value: opts.docScrollHeight,
    });
}

describe("useScroll()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setWindowDimensions({
      scrollX: 0,
      scrollY: 0,
      innerWidth: 1024,
      innerHeight: 768,
      docScrollWidth: 1024,
      docScrollHeight: 2000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 초기값
  // -------------------------------------------------------------------------

  describe("초기값", () => {
    it("마운트 시 element.scrollLeft/scrollTop을 x/y 초기값으로 설정한다", () => {
      const el = makeEl({ scrollLeft: 50, scrollTop: 100 });
      const { result } = renderHook(() => useScroll(el));
      expect(result.current.x.get()).toBe(50);
      expect(result.current.y.get()).toBe(100);
    });

    it("마운트 시 window.scrollX/scrollY를 x/y 초기값으로 설정한다 (Window target)", () => {
      setWindowDimensions({ scrollX: 20, scrollY: 40 });
      const { result } = renderHook(() => useScroll(window));
      expect(result.current.x.get()).toBe(20);
      expect(result.current.y.get()).toBe(40);
    });

    it("마운트 시 documentElement.scrollLeft/scrollTop을 x/y 초기값으로 설정한다 (Document target)", () => {
      Object.defineProperty(document.documentElement, "scrollLeft", {
        writable: true,
        configurable: true,
        value: 10,
      });
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 30,
      });
      const { result } = renderHook(() => useScroll(document));
      expect(result.current.x.get()).toBe(10);
      expect(result.current.y.get()).toBe(30);
    });

    it("초기 arrivedState는 top=true, left=true, right=false, bottom=false이다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el));
      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.left.get()).toBe(true);
      expect(result.current.arrivedState.right.get()).toBe(false);
      expect(result.current.arrivedState.bottom.get()).toBe(false);
    });

    it("초기 isScrolling은 false이다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el));
      // advance timers to let idle expire
      act(() => { vi.runAllTimers(); });
      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("초기 directions는 모두 false이다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el));
      const d = result.current.directions;
      expect(d.left.get()).toBe(false);
      expect(d.right.get()).toBe(false);
      expect(d.top.get()).toBe(false);
      expect(d.bottom.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // x / y 업데이트
  // -------------------------------------------------------------------------

  describe("x / y 업데이트", () => {
    it("아래로 스크롤 시 y가 증가한다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(200);
    });

    it("위로 스크롤 시 y가 감소한다", () => {
      const el = makeEl({ scrollTop: 300 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(100);
    });

    it("오른쪽으로 스크롤 시 x가 증가한다", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 150;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(150);
    });

    it("왼쪽으로 스크롤 시 x가 감소한다", () => {
      const el = makeEl({ scrollLeft: 200 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 50;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(50);
    });

    it("수직 스크롤만 발생 시 x는 변경되지 않는다", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(0);
    });

    it("수평 스크롤만 발생 시 y는 변경되지 않는다", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // arrivedState
  // -------------------------------------------------------------------------

  describe("arrivedState", () => {
    it("scrollTop이 0일 때 top=true이다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));
      expect(result.current.arrivedState.top.get()).toBe(true);
    });

    it("scrollTop이 0보다 클 때 top=false이다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 10;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(false);
    });

    it("scrollTop이 maxScrollY에 도달했을 때 bottom=true이다", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 600;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });

    it("scrollLeft가 0일 때 left=true이다", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(el));
      expect(result.current.arrivedState.left.get()).toBe(true);
    });

    it("scrollLeft가 maxScrollX에 도달했을 때 right=true이다", () => {
      // scrollWidth=500, clientWidth=300 → maxX=200
      const el = makeEl({ scrollLeft: 0, scrollWidth: 500, clientWidth: 300 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.right.get()).toBe(true);
    });

    it("offset.top 설정 시 scrollTop <= offset.top 이면 top=true이다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() =>
        useScroll(el, { offset: { top: 50 } }),
      );

      act(() => {
        (el as any).scrollTop = 30;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(true);
    });

    it("offset.bottom 설정 시 maxScrollY - scrollTop <= offset.bottom 이면 bottom=true이다", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() =>
        useScroll(el, { offset: { bottom: 50 } }),
      );

      act(() => {
        // 600 - 50 = 550 → scrollTop >= 550 이면 bottom=true
        (el as any).scrollTop = 550;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });

    it("스크롤 불가능한 요소(scrollHeight === clientHeight)에서 top=true, bottom=true이다", () => {
      // maxY = 400 - 400 = 0
      const el = makeEl({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // directions
  // -------------------------------------------------------------------------

  describe("directions", () => {
    it("아래로 스크롤 시 bottom=true, top=false이다", () => {
      const el = makeEl({ scrollTop: 100 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.bottom.get()).toBe(true);
      expect(result.current.directions.top.get()).toBe(false);
    });

    it("위로 스크롤 시 top=true, bottom=false이다", () => {
      const el = makeEl({ scrollTop: 200 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.top.get()).toBe(true);
      expect(result.current.directions.bottom.get()).toBe(false);
    });

    it("오른쪽으로 스크롤 시 right=true, left=false이다", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.right.get()).toBe(true);
      expect(result.current.directions.left.get()).toBe(false);
    });

    it("왼쪽으로 스크롤 시 left=true, right=false이다", () => {
      const el = makeEl({ scrollLeft: 200 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollLeft = 50;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.left.get()).toBe(true);
      expect(result.current.directions.right.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isScrolling
  // -------------------------------------------------------------------------

  describe("isScrolling", () => {
    it("scroll 이벤트 발생 시 true가 된다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.isScrolling.get()).toBe(true);
    });

    it("idle 시간(기본 200ms) 후 false가 된다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("idle 옵션으로 대기 시간을 조정할 수 있다", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(el, { idle: 500 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(200);
      });
      expect(result.current.isScrolling.get()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("idle 만료 시 onStop 콜백이 호출된다", () => {
      const onStop = vi.fn();
      const el = makeEl();
      renderHook(() => useScroll(el, { onStop, idle: 100 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });

      expect(onStop).toHaveBeenCalledOnce();
    });

    it("idle 만료 전 추가 스크롤 발생 시 타이머가 리셋된다", () => {
      const onStop = vi.fn();
      const el = makeEl();
      renderHook(() => useScroll(el, { onStop, idle: 200 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });
      expect(onStop).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // measure()
  // -------------------------------------------------------------------------

  describe("measure()", () => {
    it("수동 호출 시 현재 스크롤 상태를 재계산한다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 300;
        result.current.measure();
      });

      expect(result.current.y.get()).toBe(300);
    });

    it("measure() 호출 시 x/y/arrivedState/directions가 모두 갱신된다", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 600;
        result.current.measure();
      });

      expect(result.current.y.get()).toBe(600);
      expect(result.current.arrivedState.bottom.get()).toBe(true);
      expect(result.current.directions.bottom.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // throttle 옵션
  // -------------------------------------------------------------------------

  describe("throttle 옵션", () => {
    it("throttle 미설정 시 매 scroll 이벤트마다 measure가 호출된다", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(200);
    });

    it("throttle 설정 시 지정된 ms 이내의 연속 호출은 무시된다", () => {
      vi.useRealTimers(); // real timers needed for Date.now()

      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el, { throttle: 100 }));

      act(() => {
        (el as any).scrollTop = 50;
        el.dispatchEvent(new Event("scroll"));
      });
      const firstY = result.current.y.get();
      expect(firstY).toBe(50);

      act(() => {
        // Second scroll within throttle window → skipped
        (el as any).scrollTop = 80;
        el.dispatchEvent(new Event("scroll"));
      });
      // y should remain 50 (throttled)
      expect(result.current.y.get()).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // target 타입별 동작
  // -------------------------------------------------------------------------

  describe("target 타입별 동작", () => {
    it("Window target — scrollX/scrollY 기준으로 동작한다", () => {
      setWindowDimensions({ scrollX: 0, scrollY: 0 });
      const { result } = renderHook(() => useScroll(window));

      act(() => {
        setWindowDimensions({ scrollY: 500 });
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(500);
    });

    it("Document target — documentElement.scrollLeft/scrollTop 기준으로 동작한다", () => {
      Object.defineProperty(document.documentElement, "scrollLeft", {
        writable: true,
        configurable: true,
        value: 0,
      });
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useScroll(document));

      act(() => {
        Object.defineProperty(document.documentElement, "scrollTop", {
          writable: true,
          configurable: true,
          value: 300,
        });
        document.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(300);
    });

    it("HTMLElement target — scrollLeft/scrollTop 기준으로 동작한다", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(el));

      act(() => {
        (el as any).scrollTop = 150;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(150);
    });
  });

  // -------------------------------------------------------------------------
  // 엣지케이스: null target
  // -------------------------------------------------------------------------

  describe("엣지케이스: null target", () => {
    it("null target 전달 시 에러 없이 x=0, y=0을 반환한다", () => {
      const { result } = renderHook(() => useScroll(null));
      expect(result.current.x.get()).toBe(0);
      expect(result.current.y.get()).toBe(0);
    });

    it("null target 전달 시 arrivedState/directions는 초기 기본값을 유지한다", () => {
      const { result } = renderHook(() => useScroll(null));
      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.left.get()).toBe(true);
      expect(result.current.arrivedState.right.get()).toBe(false);
      expect(result.current.arrivedState.bottom.get()).toBe(false);
    });

    it("null target 전달 시 scroll 이벤트 리스너를 등록하지 않는다", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      renderHook(() => useScroll(null));
      const scrollCalls = addSpy.mock.calls.filter(([type]) => type === "scroll");
      expect(scrollCalls).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 언마운트 / cleanup
  // -------------------------------------------------------------------------

  describe("언마운트 / cleanup", () => {
    it("언마운트 시 scroll 이벤트 리스너가 제거된다", async () => {
      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      const { unmount } = renderHook(() => useScroll(el));
      unmount();
      await flush();

      expect(addSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
      expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("언마운트 시 진행 중인 idle 타이머가 정리된다", async () => {
      const onStop = vi.fn();
      const el = makeEl();
      const { unmount } = renderHook(() =>
        useScroll(el, { onStop, idle: 200 }),
      );

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      unmount();
      await flush();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onStop).not.toHaveBeenCalled();
    });
  });
});
