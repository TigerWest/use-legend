/** @internal — tracks the currently active EffectScope during scope.run() */
let _currentScope: EffectScope | null = null;

/**
 * @internal
 * Collects reactive effects, lifecycle callbacks, and child scopes.
 * Disposing the scope cleans up all registered resources in reverse registration order.
 */
export class EffectScope {
  active = true;

  /** @internal */ readonly _disposables: Array<() => void> = [];
  /** @internal */ readonly _children: EffectScope[] = [];
  /** @internal */ _parent: EffectScope | null = null;
  /** @internal */ readonly _beforeMountCbs: Array<() => void> = [];
  /** @internal */ readonly _mountCbs: Array<() => (() => void) | void> = [];

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

  /** @internal Register a disposal callback. */
  _addDispose(fn: () => void): void {
    if (this.active) this._disposables.push(fn);
  }

  /**
   * Dispose the scope: stops all child scopes and runs all registered cleanup functions
   * in reverse registration order. Safe to call multiple times.
   */
  dispose(): void {
    if (!this.active) return;
    this.active = false;

    // children: reverse registration order
    for (let i = this._children.length - 1; i >= 0; i--) {
      this._children[i].dispose();
    }
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
