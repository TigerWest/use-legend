import React from "react";
import type { EffectScope } from "../useScope/effectScope";

// Shared between state/createStore and state/useScope layers.

/** Shared mutable ref between sync wrapping (core) and async DevTools connection. */
export interface ActionTracker {
  activeAction: string | null;
  dispatch: ((actionType: string) => void) | null;
}

export interface StoreRegistryValue {
  registry: Map<string, unknown>;
  scopes: Map<string, EffectScope>;
  mounted: boolean;
  dangerouslyUseInProduction: boolean;
  actionTrackers: Map<string, ActionTracker>;
}

export const StoreRegistryContext = React.createContext<StoreRegistryValue | null>(null);
StoreRegistryContext.displayName = "StoreRegistry";

// --- activeValue singleton ---
// Tracks the currently-resolving StoreRegistryValue during store setup() execution.
// Set by resolveStore() in core.ts, and also by useScope() when inside a StoreProvider,
// so that getStore() works naturally inside useScope factories.
//
// Note: NOT safe under true React Concurrent Mode with simultaneous renders from
// different StoreProviders. In practice, synchronous store resolution prevents races.

let _activeValue: StoreRegistryValue | null = null;

export function getActiveValue(): StoreRegistryValue | null {
  return _activeValue;
}

/** Sets activeValue and returns the previous value for restoration. */
export function setActiveValue(v: StoreRegistryValue | null): StoreRegistryValue | null {
  const prev = _activeValue;
  _activeValue = v;
  return prev;
}
