"use client";

import React from "react";
import type { StoreRegistryValue } from "./core";
import { StoreRegistryContext } from "./core";

export { createStore, __resetStoreDefinitions, StoreRegistryContext } from "./core";
export type { StoreProviderProps, StoreState, StoreActions, StoreRegistryValue } from "./core";

/**
 * Provides a store registry to the component tree.
 * Each StoreProvider creates its own isolated registry (SSR safe).
 *
 * Stores are lazily initialized on first access via `useStore()`.
 * No StoreHost nesting — setup() runs as plain JS, not inside a React component.
 */
export const StoreProvider: React.FC<{
  children: React.ReactNode;
  _devtools?: boolean;
}> = ({ children, _devtools = false }) => {
  const [value] = React.useState<StoreRegistryValue>(() => ({
    registry: new Map<string, unknown>(),
    devtools: _devtools,
    actionTrackers: new Map(),
  }));

  React.useEffect(() => {
    return () => {
      if (process.env.NODE_ENV !== "production" || value.devtools) {
        void import("./devtools").then(({ cleanupDevTools }) => {
          cleanupDevTools(value.registry);
          value.registry.clear();
        });
      } else {
        value.registry.clear();
      }
    };
  }, [value]);

  return React.createElement(StoreRegistryContext.Provider, { value }, children);
};

StoreProvider.displayName = "StoreProvider";
