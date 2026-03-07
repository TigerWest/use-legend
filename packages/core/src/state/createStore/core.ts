import type { ImmutableObservableBase } from "@legendapp/state";
import { isObservable } from "@legendapp/state";
import React from "react";

// --- Types ---

interface StoreDefinition {
  name: string;
  setup: () => unknown;
}

export interface StoreProviderProps {
  children: React.ReactNode;
  _devtools?: boolean;
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

// --- Action tracking ---

/** Shared mutable ref between sync wrapping (core) and async DevTools connection. */
export interface ActionTracker {
  activeAction: string | null;
  dispatch: ((actionType: string) => void) | null;
}

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

// --- Registry value (per StoreProvider) ---

export interface StoreRegistryValue {
  registry: Map<string, unknown>;
  devtools: boolean;
  actionTrackers: Map<string, ActionTracker>;
}

// --- Module-scoped state ---

const storeDefinitions = new Map<string, StoreDefinition>();
let activeValue: StoreRegistryValue | null = null;

// --- Registry Context ---

export const StoreRegistryContext = React.createContext<StoreRegistryValue | null>(null);

StoreRegistryContext.displayName = "StoreRegistry";

// --- Internal: resolveStore ---

function resolveStore<T>(name: string, setup: () => T, value: StoreRegistryValue): T {
  const { registry } = value;
  if (!registry.has(name)) {
    const prev = activeValue;
    activeValue = value;
    try {
      const instance = setup();
      registry.set(name, instance);
      // DevTools
      if (process.env.NODE_ENV !== "production" || value.devtools) {
        const store = instance as Record<string, unknown>;
        // Sync: wrap functions immediately so destructured refs are always wrapped
        wrapStoreActions(name, store, value.actionTrackers);
        // Async: connect DevTools (observers + dispatch binding)
        void import("./devtools")
          .then(({ connectDevTools }) => {
            connectDevTools(name, store, value);
          })
          .catch(() => {});
      }
    } finally {
      activeValue = prev;
    }
  }
  return registry.get(name) as T;
}

// --- Public API ---

/**
 * Creates a store definition and returns a hook to access the store value.
 *
 * Uses the activeValue pattern: when called from inside another store's
 * setup(), the activeValue short-circuits useContext so inter-store
 * dependencies are resolved without a React component tree.
 *
 * When called from a React component, the hook reads from the nearest
 * StoreProvider's registry via context.
 */
export function createStore<T extends Record<string, unknown>>(
  name: string,
  setup: () => T
): () => T {
  // HMR handling: allow re-definition in development
  if (storeDefinitions.has(name)) {
    if (process.env.NODE_ENV !== "production") {
      storeDefinitions.delete(name);
    } else {
      throw new Error(`createStore: store "${name}" is already defined`);
    }
  }
  storeDefinitions.set(name, { name, setup });

  function useStore(): T {
    // Path 1: called from another store's setup() — activeValue is set
    if (activeValue) {
      return resolveStore(name, setup, activeValue);
    }

    // Path 2: called from a React component — read registry value from context.
    // The eslint-disable is safe here: this branch is only reached when
    // activeValue is null, which only happens outside of setup() execution.
    // The hook call order is always consistent from React's perspective.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = React.useContext(StoreRegistryContext);
    if (!value) {
      throw new Error(`createStore: "${name}" must be used within a <StoreProvider>`);
    }
    return resolveStore(name, setup, value);
  }

  return useStore;
}

// --- Internal: Test Helpers ---

/**
 * @internal Resets store definitions. Only for testing.
 */
export function __resetStoreDefinitions(): void {
  storeDefinitions.clear();
}
