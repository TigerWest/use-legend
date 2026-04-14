import { observe as legendObserve } from "@legendapp/state";

/** @internal — tracks the currently active EffectScope during scope.run() */
let _currentScope: EffectScope | null = null;

/** @internal */
export interface ObserverRecord {
  args: Parameters<typeof legendObserve>;
  unsub?: () => void;
}

/**
 * @internal
 * Collects reactive effects, lifecycle callbacks, and child scopes.
 *
 * Two cleanup tracks:
 * - `_disposables`: generic cleanup callbacks (via `_addDispose`). Drained only on `dispose()`.
 * - `_observers`:  pausable legend-state `observe()` registrations. Drained on `dispose()` or
 *                  temporarily via `_pauseAll()` / `_resumeAll()` for Strict Mode cycles.
 *
 * Disposing the scope cleans up all registered resources in reverse registration order.
 */
export class EffectScope {
  active = true;

  /** @internal */ readonly _disposables: Array<() => void> = [];
  /** @internal */ readonly _observers: ObserverRecord[] = [];
  /** @internal */ readonly _children: EffectScope[] = [];
  /** @internal */ _parent: EffectScope | null = null;
  /** @internal */ readonly _beforeMountCbs: Array<() => void> = [];
  /** @internal */ readonly _mountCbs: Array<() => (() => void) | void> = [];
  /** @internal — React.Context refs collected by `inject()` during first-mount run */
  readonly _recordedCtxs: unknown[] = [];
  /** @internal — true only during the first-mount `scope.run()` in useScope */
  _injectRecording = false;

  constructor() {
    this._parent = _currentScope;
    _currentScope?._children.push(this);
  }

  /**
   * Run a function inside this scope.
   * Any `onMount`, `onBeforeMount`, `observe()` calls made during
   * execution are registered to this scope.
   */
  run<T>(fn: () => T): T {
    if (!this.active) return undefined as T;
    const prev = _currentScope;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    _currentScope = this;
    try {
      return fn();
    } finally {
      _currentScope = prev;
    }
  }

  /** @internal Register a generic disposal callback. */
  _addDispose(fn: () => void): void {
    if (this.active) this._disposables.push(fn);
  }

  /**
   * @internal
   * Temporarily unsubscribe every observer record in this scope (and recursively in children).
   * Records are preserved so `_resumeAll()` can re-subscribe later.
   * Idempotent — safe to call on an already-paused scope.
   */
  _pauseAll(): void {
    for (let i = this._observers.length - 1; i >= 0; i--) {
      const r = this._observers[i];
      r.unsub?.();
      r.unsub = undefined;
    }
    for (const child of this._children) child._pauseAll();
  }

  /**
   * @internal
   * Re-subscribe every paused observer record in this scope (and recursively in children).
   * Idempotent — already-active observers are left alone.
   */
  _resumeAll(): void {
    for (const r of this._observers) {
      if (!r.unsub)
        r.unsub = (legendObserve as (...args: ObserverRecord["args"]) => () => void)(...r.args);
    }
    for (const child of this._children) child._resumeAll();
  }

  /**
   * Dispose the scope: stops all child scopes, unsubscribes all observers, and runs all
   * registered `_disposables` in reverse registration order. Safe to call multiple times.
   */
  dispose(): void {
    if (!this.active) return;
    this.active = false;

    // children: reverse registration order
    for (let i = this._children.length - 1; i >= 0; i--) {
      this._children[i].dispose();
    }
    // observers: reverse registration order — unsub and clear
    for (let i = this._observers.length - 1; i >= 0; i--) {
      const r = this._observers[i];
      r.unsub?.();
      r.unsub = undefined;
    }
    this._observers.length = 0;
    // disposables: reverse registration order
    for (let i = this._disposables.length - 1; i >= 0; i--) {
      this._disposables[i]();
    }
    this._disposables.length = 0;
    this._children.length = 0;

    // detach from parent so parent.dispose() won't call us again
    if (this._parent) {
      const idx = this._parent._children.indexOf(this);
      if (idx !== -1) this._parent._children.splice(idx, 1);
      this._parent = null;
    }
  }
}

/** @internal Create a new EffectScope. */
export function effectScope(): EffectScope {
  return new EffectScope();
}

/** @internal Returns the currently active EffectScope, or null if outside any scope. */
export function getCurrentScope(): EffectScope | null {
  return _currentScope;
}

/**
 * Register a callback to run before the component mounts (useLayoutEffect timing).
 * Must be called inside a `useScope` factory. No-op outside a scope.
 */
export function onBeforeMount(cb: () => void): void {
  _currentScope?._beforeMountCbs.push(cb);
}

/**
 * Register a callback to run after the component mounts (useEffect timing).
 * The callback may return a cleanup function that runs on unmount.
 * Must be called inside a `useScope` factory. No-op outside a scope.
 */
export function onMount(cb: () => (() => void) | void): void {
  _currentScope?._mountCbs.push(cb);
}

/**
 * Register a callback to run when the component unmounts.
 * Shorthand for `onMount(() => cb)`.
 * Must be called inside a `useScope` factory. No-op outside a scope.
 */
export function onUnmount(cb: () => void): void {
  onMount(() => cb);
}

/**
 * Create a new EffectScope that is NOT attached to any parent scope.
 * Use this when you need a root-level scope that won't be disposed when a parent scope disposes.
 * The caller is responsible for calling scope.dispose() manually.
 */
export function detachedEffectScope(): EffectScope {
  const prev = _currentScope;
  _currentScope = null; // prevent parent registration
  const scope = new EffectScope();
  _currentScope = prev; // restore caller's scope context
  return scope;
}
