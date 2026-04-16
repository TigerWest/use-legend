---
title: Utility Hooks
description: Category map of @usels/core utility hooks — when to reach for which.
---

`@usels/core` ships a collection of observable-first utility hooks. This page is a category map — for each hook's full signature and parameters, open the hook's own reference in the API docs.

## State

- `useObservable` (re-exported from `@legendapp/state/react`) — primary state primitive. Replaces `useState` for reactive values.
- `useMaybeObservable` — normalize a plain value, per-field observables, or an outer observable into a single `DeepMaybeObservable<T>`. Useful for wrapping component props.
- `useOpaque` — wrap a non-proxyable value (DOM element, class instance) so Legend-State does not deep-proxy it.
- `useInitialPick` — take an initial snapshot from an observable source.
- `useSilentObservable` — update an observable without notifying subscribers.
- `useAutoReset`, `useManualReset` — observables that reset to an initial value on a schedule or via a callback.
- `useComputedWithControl` — computed observable with explicit recomputation control.

## History

- `useManualHistory` — manual commit-based undo/redo.
- `useDataHistory` — automatic history over an observable source.
- `useThrottledHistory` — history with throttled commits.
- `useDebouncedHistory` — history with debounced commits.
- `useLastChanged` — timestamp of the last change to an observable.

## Effects

- `useObserve` (re-exported from `@legendapp/state/react`) — track-any-read effect. Re-runs whenever any observable read inside fires.
- `useWatch` — selector-based effect. Skips the initial value by default; `immediate: true` to include it.
- `useWhenever` — fires when the selector becomes truthy. Pass `{ once: true }` for one-shot behavior.
- `useObserveWithFilter` — observe gated by a filter predicate.
- `useObserveDebounced`, `useObserveThrottled` — rate-capped effect scheduling.
- `useObservePausable`, `useObserveIgnorable`, `useObserveTriggerable` — manually controllable effects.

## DOM / Refs

- `useRef$` — reactive ref. Observable element reference that integrates with `getElement` / `peekElement` utilities.
- For element-specific hooks (`useMouse`, `useDraggable`, `useElementSize`, etc.), see the `@usels/web` package docs.

## Timers

- `useTimeoutFn` — `setTimeout`-based one-shot. Returns `Stoppable`.
- `useIntervalFn` — `setInterval`-based loop. Returns `Pausable`.
- `useRafFn` — `requestAnimationFrame` loop. Returns `Pausable`.
- `useTimeout`, `useInterval` — reactive schedule flags.
- `useNow`, `useTimestamp`, `useFps` — reactive time values.
- `useTimeAgo` — human-readable relative time.
- `useCountdown` — countdown observable.

## Rate Limiting

- `useDebounced` — debounced observable. Waits for quiescence before committing.
- `useThrottled` — throttled observable. Rate-caps emissions.
- `useDebounceFn`, `useThrottleFn` — debounced / throttled callbacks.
- `usePausableFilter` — filter that can be paused/resumed.

## Lifecycle / Readiness

- `useIsMounted` — reactive mount flag.
- `useWhenMounted` — run a callback once the component is mounted.
- `useMount`, `useUnmount` (re-exported from `@legendapp/state/react`) — mount / unmount callbacks.
- `useSupported` — reactive flag for a capability check.
- `usePermissionAware` — reactive permission gate.

## Sync & Persistence

- `useStorage` — observable synced with `localStorage` / `sessionStorage`.
- `useRemote` — observable synced with a remote source.
- `useOfflineFirst` — offline-first sync strategy.

## Store Infrastructure

- `createStore` — provider-scoped store factory.
- `createProvider` — lower-level provider utility.

## Related

- [Derived State & Effects](/use-legend/guides/patterns/derived-state-and-effects/) — combining observables and effects for derived values.
- [Data Fetching](/use-legend/guides/patterns/data-fetching/) — applied effects around I/O.
- [Persisted State](/use-legend/guides/patterns/persisted-state/) — recipes using the sync hooks above.
