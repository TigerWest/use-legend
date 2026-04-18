"use client";

import React from "react";
import type { EffectScope } from "../useScope/effectScope";
import type { StoreProviderProps } from "./core";
import type { ActionTracker, StoreRegistryValue } from "./storeContext";
import { StoreRegistryContext } from "./storeContext";

export { createStore, __resetStoreDefinitions } from "./core";
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
 * StoreProvider is responsible for draining onMount cleanup callbacks on unmount.
 *
 * Lifecycle timing:
 * - Stores first accessed during the initial render have their `onMount` callbacks
 *   executed inside `StoreProvider`'s `useEffect`.
 * - Stores first accessed after the provider has mounted (e.g. behind conditional
 *   rendering) have their `onMount` callbacks executed immediately inside
 *   `resolveStore`. Cleanup functions are still drained on provider unmount.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({
  children,
  dangerouslyUseInProduction = false,
}) => {
  const [value] = React.useState<StoreRegistryValue>(() => ({
    registry: new Map<string, unknown>(),
    scopes: new Map<string, EffectScope>(),
    mounted: false,
    dangerouslyUseInProduction,
    actionTrackers: new Map<string, ActionTracker>(),
    cleanups: [],
  }));
  React.useEffect(() => {
    value.mounted = true;

    // Resume observers that were paused during a Strict Mode cleanup cycle.
    // On the very first mount this is a no-op (no paused records yet).
    for (const scope of value.scopes.values()) {
      scope._resumeAll();
    }

    // Re-connect DevTools after Strict Mode remount (no-op on first mount
    // because connectDevTools is already called during resolveStore).
    if (process.env.NODE_ENV !== "production" || value.dangerouslyUseInProduction) {
      void import("./devtools").then(({ connectDevTools }) => {
        for (const [name, store] of value.registry) {
          connectDevTools(name, store as Record<string, unknown>, value);
        }
      });
    }

    // Execute onMount callbacks for all stores registered during initial render.
    // Cleanups are appended to value.cleanups so that resolveStore (late-mount path)
    // can push its own cleanups into the same LIFO list.
    for (const scope of value.scopes.values()) {
      for (const cb of scope._mountCbs) {
        try {
          const r = cb();
          if (typeof r === "function") value.cleanups.push(r);
        } catch (e) {
          console.error(e);
        }
      }
    }

    return () => {
      value.mounted = false;

      // Run all onMount cleanups (initial + late-mounted) in reverse order (LIFO)
      for (let i = value.cleanups.length - 1; i >= 0; i--) {
        try {
          value.cleanups[i]();
        } catch (e) {
          console.error(e);
        }
      }
      value.cleanups.length = 0;

      // Pause all observers — preserves records so _resumeAll() can restore them
      // on the next mount (Strict Mode remount or actual remount).
      // This mirrors useScope's _pauseAll/_resumeAll pattern.
      for (const scope of value.scopes.values()) {
        try {
          scope._pauseAll();
        } catch (e) {
          console.error(e);
        }
      }

      // Clean up DevTools connection (dispose onChange listeners, disconnect).
      // On Strict Mode remount, connectDevTools will re-establish the connection.
      if (process.env.NODE_ENV !== "production" || value.dangerouslyUseInProduction) {
        const registrySnapshot = new Map(value.registry);
        void import("./devtools").then(({ cleanupDevTools }) => {
          cleanupDevTools(registrySnapshot);
        });
      }
    };
  }, [value]);

  return React.createElement(StoreRegistryContext.Provider, { value }, children);
};

StoreProvider.displayName = "StoreProvider";
