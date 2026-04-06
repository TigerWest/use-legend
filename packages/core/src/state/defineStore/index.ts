"use client";

import React from "react";
import type { EffectScope } from "../useScope/effectScope";
import type { ActionTracker, StoreRegistryValue } from "./storeContext";
import { StoreRegistryContext } from "./storeContext";

export { createStore, defineStore, __resetStoreDefinitions } from "./core";
export type { StoreProviderProps, StoreState, StoreActions } from "./core";
export type { StoreRegistryValue, ActionTracker } from "./storeContext";
export { StoreRegistryContext } from "./storeContext";

/**
 * Returns the current StoreRegistryValue from the nearest StoreProvider,
 * or null if not inside a StoreProvider. Does NOT throw.
 * Useful for passing registry to getStore() in contexts like useScope.
 */
export function useStoreRegistry(): StoreRegistryValue | null {
  return React.useContext(StoreRegistryContext);
}

/**
 * Provides a store registry to the component tree.
 * Each StoreProvider creates its own isolated registry (SSR safe).
 *
 * Stores are lazily initialized on first access via `useStore()`.
 * StoreProvider is responsible for executing onMount/onUnmount lifecycle callbacks.
 *
 * Lazy init limitation: onMount is only called for stores first accessed during
 * the initial render (before StoreProvider's useEffect runs). Stores accessed
 * after mount will NOT have their onMount callbacks executed.
 */
export const StoreProvider: React.FC<{
  children: React.ReactNode;
  _devtools?: boolean;
}> = ({ children, _devtools = false }) => {
  const [value] = React.useState<StoreRegistryValue>(() => ({
    registry: new Map<string, unknown>(),
    scopes: new Map<string, EffectScope>(),
    mounted: false,
    devtools: _devtools,
    actionTrackers: new Map<string, ActionTracker>(),
  }));

  React.useEffect(() => {
    value.mounted = true;
    const cleanups: (() => void)[] = [];

    // Execute onMount callbacks for all stores registered during initial render
    for (const scope of value.scopes.values()) {
      for (const cb of scope._mountCbs) {
        try {
          const r = cb();
          if (typeof r === "function") cleanups.push(r);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return () => {
      value.mounted = false;

      // Run onMount cleanup functions in reverse order (LIFO)
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try {
          cleanups[i]();
        } catch (e) {
          console.error(e);
        }
      }

      // Dispose all scopes (auto-unsubs observe() + runs onUnmount callbacks)
      for (const scope of value.scopes.values()) {
        try {
          scope.dispose();
        } catch (e) {
          console.error(e);
        }
      }
      value.scopes.clear();

      // Clean up registry — always clear synchronously to prevent stale hits
      // (scopes.clear() is already synchronous above; registry must match)
      if (process.env.NODE_ENV !== "production" || value.devtools) {
        const registrySnapshot = new Map(value.registry);
        value.registry.clear();
        void import("./devtools").then(({ cleanupDevTools }) => {
          cleanupDevTools(registrySnapshot);
        });
      } else {
        value.registry.clear();
      }
    };
  }, [value]);

  return React.createElement(StoreRegistryContext.Provider, { value }, children);
};

StoreProvider.displayName = "StoreProvider";
