// @vitest-environment jsdom
import { describe, bench, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { effectScope } from "../effectScope";

// Original hooks
import { useIntervalFn } from "@timer/useIntervalFn";
import { createIntervalFn } from "@timer/useIntervalFn/core";
import { useInterval } from "@timer/useInterval";
import { createInterval } from "@timer/useInterval/core";

// Scoped variants
import { useIntervalFnScoped } from "./useIntervalFnScoped";
import { createIntervalFnScoped } from "./createIntervalFnScoped";
import { useIntervalScoped } from "./useIntervalScoped";
import { createIntervalScoped } from "./createIntervalScoped";

const noop = () => {};

afterEach(() => {
  cleanup();
});

// ── Core-only (no React overhead) ─────────────────────────────────────────

describe("core: createIntervalFn", () => {
  bench("original — create + dispose", () => {
    const interval$ = observable(1000);
    const result = createIntervalFn(noop, interval$, { immediate: false });
    result.dispose();
  });

  bench("scoped — effectScope.run + dispose", () => {
    const interval$ = observable(1000);
    const scope = effectScope();
    scope.run(() => {
      createIntervalFnScoped(noop, interval$, { immediate: false });
    });
    scope.dispose();
  });
});

describe("core: createInterval", () => {
  bench("original — create + dispose", () => {
    const interval$ = observable(1000);
    const result = createInterval(interval$, { immediate: false });
    result.dispose();
  });

  bench("scoped — effectScope.run + dispose", () => {
    const interval$ = observable(1000);
    const scope = effectScope();
    scope.run(() => {
      createIntervalScoped(interval$, { immediate: false });
    });
    scope.dispose();
  });
});

// ── Hook init (React renderHook + full lifecycle) ──────────────────────────

describe("hook init: useIntervalFn", () => {
  bench("original", () => {
    const { unmount } = renderHook(() => useIntervalFn(noop, 1000, { immediate: false }));
    unmount();
  });

  bench("scoped", () => {
    const { unmount } = renderHook(() => useIntervalFnScoped(noop, 1000, { immediate: false }));
    unmount();
  });
});

describe("hook init: useInterval", () => {
  bench("original", () => {
    const { unmount } = renderHook(() => useInterval(1000, { immediate: false }));
    unmount();
  });

  bench("scoped", () => {
    const { unmount } = renderHook(() => useIntervalScoped(1000, { immediate: false }));
    unmount();
  });
});
