import type { ImmutableObservableBase } from "@legendapp/state";
import { isObservable } from "@legendapp/state";
import React from "react";
import { detachedEffectScope } from "../useScope/effectScope";
import {
  type ActionTracker,
  type StoreRegistryValue,
  StoreRegistryContext,
  getActiveValue,
  setActiveValue,
} from "./storeContext";

// --- Types ---

interface StoreDefinition {
  name: string;
  setup: () => unknown;
}

export interface StoreProviderProps {
  children: React.ReactNode;
  dangerouslyUseInProduction?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- intentional: conditional type matching requires `any` */

/** Extract observable fields from a store record. */
export type StoreState<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends ImmutableObservableBase<any> ? K : never]: T[K];
};

/** Extract action (non-observable function) fields from a store record. */
export type StoreActions<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends ImmutableObservableBase<any>
    ? never
    : T[K] extends (...args: any[]) => any
      ? K
      : never]: T[K];
};

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Synchronously wrap function values on the store for action-level tracking.
 * The actual DevTools dispatch is deferred until connectDevTools populates tracker.dispatch.
 */
function wrapStoreActions(
  name: string,
  store: Record<string, unknown>,
  actionTrackers: Map<string, ActionTracker>
): void {
  const tracker: ActionTracker = { activeAction: null, dispatch: null };
  actionTrackers.set(name, tracker);

  for (const [key, val] of Object.entries(store)) {
    if (typeof val !== "function" || isObservable(val)) continue;

    const actionType = `${name}/${key}`;
    const original = val as (...args: unknown[]) => unknown;

    store[key] = (...args: unknown[]) => {
      const prev = tracker.activeAction;
      tracker.activeAction = actionType;
      try {
        const result = original(...args);
        tracker.dispatch?.(actionType);
        return result;
      } finally {
        tracker.activeAction = prev;
      }
    };
  }
}

// --- Module-scoped state ---

const storeDefinitions = new Map<string, StoreDefinition>();

// --- Internal: resolveStore ---

function resolveStore<T>(name: string, setup: () => T, value: StoreRegistryValue): T {
  const { registry, scopes } = value;
  if (!registry.has(name)) {
    const prev = setActiveValue(value);
    try {
      const scope = detachedEffectScope();
      let instance: T;
      try {
        instance = scope.run(setup);
      } catch (e) {
        scope.dispose();
        throw e;
      }
      scopes.set(name, scope);
      registry.set(name, instance!);

      if (scope._beforeMountCbs.length > 0) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[createStore] "${name}": onBeforeMount is not supported in store setup. ` +
              `Use onMount or onUnmount instead.`
          );
        }
        scope._beforeMountCbs.length = 0;
      }

      // Late-mount path: if the StoreProvider already ran its useEffect,
      // execute onMount callbacks now and push returned cleanups into the
      // provider's shared cleanups list so they drain on provider unmount.
      if (value.mounted) {
        for (const cb of scope._mountCbs) {
          try {
            const r = cb();
            if (typeof r === "function") value.cleanups.push(r);
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (process.env.NODE_ENV !== "production" || value.dangerouslyUseInProduction) {
        const store = instance as Record<string, unknown>;
        wrapStoreActions(name, store, value.actionTrackers);
        void import("./devtools")
          .then(({ connectDevTools }) => {
            connectDevTools(name, store, value);
          })
          .catch(() => {});
      }
    } finally {
      setActiveValue(prev);
    }
  }
  return registry.get(name) as T;
}

// --- Public API ---

/**
 * Creates a store and returns a tuple `[useStore, getStore]`.
 *
 * - `useStore()` (tuple[0]): React hook — call inside React components via useContext.
 *   Also works inside another store's setup() via the activeValue path (backward compat).
 * - `getStore()` (tuple[1]): Core accessor — for inter-store deps inside store setup().
 *   Throws if called outside a store setup().
 *
 * The setup function runs inside an EffectScope, so `observe()`, `onMount()`, and `onUnmount()`
 * called within setup are automatically registered to the scope.
 */
export function createStore<T extends Record<string, unknown>>(
  name: string,
  setup: () => T
): [() => T, () => T] {
  // HMR handling: allow re-definition in development
  if (storeDefinitions.has(name)) {
    if (process.env.NODE_ENV !== "production") {
      storeDefinitions.delete(name);
    } else {
      throw new Error(`createStore: store "${name}" is already defined`);
    }
  }
  storeDefinitions.set(name, { name, setup });

  // [0] useStore: React hook — useContext path + activeValue fallback for inter-store deps
  function useStore(): T {
    if (getActiveValue()) {
      return resolveStore(name, setup, getActiveValue()!);
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = React.useContext(StoreRegistryContext);
    if (!value) {
      throw new Error(`createStore: "${name}" must be used within a <StoreProvider>`);
    }
    return resolveStore(name, setup, value);
  }

  // [1] getStore accessor: core function — activeValue only (inter-store deps)
  function getStore(): T {
    if (!getActiveValue()) {
      throw new Error(
        `createStore: "${name}" getStore must be called inside another store's setup() or inside a useScope factory within a <StoreProvider>`
      );
    }
    return resolveStore(name, setup, getActiveValue()!);
  }

  return [useStore, getStore];
}

// --- Internal: Test Helpers ---

/**
 * @internal Resets store definitions. Only for testing.
 */
export function __resetStoreDefinitions(): void {
  storeDefinitions.clear();
}
