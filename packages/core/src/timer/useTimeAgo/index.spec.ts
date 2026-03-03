// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ko } from "date-fns/locale";
import { formatTimeAgo, useTimeAgo } from ".";

// ---------------------------------------------------------------------------
// formatTimeAgo — pure function tests
// ---------------------------------------------------------------------------

describe("formatTimeAgo (pure function)", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  it("returns 'just now' for < 45 seconds (showSecond=false default)", () => {
    const from = new Date("2024-01-15T11:59:30Z"); // 30s ago
    expect(formatTimeAgo(from, {}, now)).toBe("just now");
  });

  it("shows 'half a minute ago' when showSecond=true and ~30s", () => {
    const from = new Date("2024-01-15T11:59:30Z"); // 30s ago
    expect(formatTimeAgo(from, { showSecond: true }, now)).toBe("half a minute ago");
  });

  it("returns 'less than 5 seconds ago' for exactly 1s (showSecond=true)", () => {
    const from = new Date("2024-01-15T11:59:59Z"); // 1s ago
    expect(formatTimeAgo(from, { showSecond: true }, now)).toBe("less than 5 seconds ago");
  });

  it("N minutes ago", () => {
    const from = new Date("2024-01-15T11:55:00Z"); // 5 min ago
    expect(formatTimeAgo(from, {}, now)).toBe("5 minutes ago");
  });

  it("1 minute ago for exactly 1 minute", () => {
    const from = new Date("2024-01-15T11:59:00Z"); // 1 min ago
    expect(formatTimeAgo(from, {}, now)).toBe("1 minute ago");
  });

  it("about N hours ago", () => {
    const from = new Date("2024-01-15T09:00:00Z"); // 3h ago
    expect(formatTimeAgo(from, {}, now)).toBe("about 3 hours ago");
  });

  it("future: in N minutes", () => {
    const from = new Date("2024-01-15T12:05:00Z"); // 5 min in future
    expect(formatTimeAgo(from, {}, now)).toBe("in 5 minutes");
  });

  it("future: in 1 day", () => {
    const from = new Date("2024-01-16T12:00:00Z"); // 1 day ahead
    expect(formatTimeAgo(from, {}, now)).toBe("in 1 day");
  });

  it("max exceeded → fullDateFormatter output", () => {
    const from = new Date("2024-01-01T00:00:00Z"); // 14 days ago
    const result = formatTimeAgo(from, { max: "day" }, now);
    // 14 days > day max (518_400_000ms = 6 days) → use fullDateFormatter
    expect(result).toBe("2024-01-01");
  });

  it("custom fullDateFormatter", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const result = formatTimeAgo(
      from,
      { max: "day", fullDateFormatter: (d) => d.toLocaleDateString("ko-KR") },
      now
    );
    expect(typeof result).toBe("string");
    expect(result).not.toBe("just now");
  });

  describe("with Korean locale (ko)", () => {
    it("N분 전 for minutes", () => {
      const from = new Date("2024-01-15T11:55:00Z"); // 5 min ago
      expect(formatTimeAgo(from, { locale: ko }, now)).toBe("5분 전");
    });

    it("약 N시간 전 for hours", () => {
      const from = new Date("2024-01-15T09:00:00Z"); // 3h ago
      expect(formatTimeAgo(from, { locale: ko }, now)).toBe("약 3시간 전");
    });

    it("1분 전 for exactly 1 minute", () => {
      const from = new Date("2024-01-15T11:59:00Z"); // 1 min ago
      expect(formatTimeAgo(from, { locale: ko }, now)).toBe("1분 전");
    });

    it("future: 5분 후", () => {
      const from = new Date("2024-01-15T12:05:00Z"); // 5 min in future
      expect(formatTimeAgo(from, { locale: ko }, now)).toBe("5분 후");
    });

    it("showSecond=true shows '30초 전' for ~30s", () => {
      const from = new Date("2024-01-15T11:59:30Z"); // 30s ago
      expect(formatTimeAgo(from, { locale: ko, showSecond: true }, now)).toBe("30초 전");
    });
  });
});

// ---------------------------------------------------------------------------
// useTimeAgo hook tests
// ---------------------------------------------------------------------------

describe("useTimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("computes initial value immediately", () => {
    const from = new Date(Date.now() - 5 * 60_000); // 5 min ago
    const { result } = renderHook(() => useTimeAgo(from));
    expect(result.current.get()).toBe("5 minutes ago");
  });

  it("updates when time Observable changes", () => {
    const time$ = observable(new Date(Date.now() - 5 * 60_000));
    const { result } = renderHook(() => useTimeAgo(time$));

    expect(result.current.get()).toBe("5 minutes ago");

    act(() => {
      time$.set(new Date(Date.now() - 2 * 60_000));
    });

    expect(result.current.get()).toBe("2 minutes ago");
  });

  it("controls=true returns { timeAgo$, isActive$, pause, resume }", () => {
    const { result } = renderHook(() => useTimeAgo(new Date(), { controls: true }));
    expect(result.current).toHaveProperty("timeAgo$");
    expect(result.current).toHaveProperty("isActive$");
    expect(result.current).toHaveProperty("pause");
    expect(result.current).toHaveProperty("resume");
  });

  it("pause() stops auto-update", () => {
    const from = new Date(Date.now() - 5 * 60_000);
    const { result } = renderHook(() => useTimeAgo(from, { controls: true, updateInterval: 1000 }));
    const initial = result.current.timeAgo$.get();

    act(() => {
      result.current.pause();
      vi.advanceTimersByTime(5000);
    });

    // value should stay the same after pause
    expect(result.current.timeAgo$.get()).toBe(initial);
    expect(result.current.isActive$.get()).toBe(false);
  });

  it("showSecond=true shows 'half a minute ago' for ~30s", () => {
    const from = new Date(Date.now() - 30_000); // 30s ago
    const { result } = renderHook(() => useTimeAgo(from, { showSecond: true }));
    expect(result.current.get()).toBe("half a minute ago");
  });
});
