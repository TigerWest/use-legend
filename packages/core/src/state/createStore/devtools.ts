import { isObservable } from "@legendapp/state";
import { isClient } from "../../shared/utils";
import type { StoreRegistryValue } from "./core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DevToolsConnection {
  init(state: unknown): void;
  send(action: { type: string }, state: unknown): void;
  subscribe(listener: (message: unknown) => void): () => void;
}

interface ReduxDevToolsExtension {
  connect(options: { name: string }): DevToolsConnection;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
  }
}

// ---------------------------------------------------------------------------
// Registry-level DevTools connection (one per StoreProvider)
// ---------------------------------------------------------------------------

interface RegistryDevTools {
  connection: DevToolsConnection;
  disposers: (() => void)[];
}

const registryDevTools = new WeakMap<Map<string, unknown>, RegistryDevTools>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Serialize a single store into a plain object. */
function serializeStore(store: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(store)) {
    if (isObservable(val)) {
      result[key] = (val as { peek(): unknown }).peek();
    } else if (typeof val !== "function") {
      result[key] = val;
    }
  }
  return result;
}

/** Serialize all stores in the registry into a combined state tree. */
function serializeRegistry(registry: Map<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, store] of registry) {
    result[name] = serializeStore(store as Record<string, unknown>);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Connect the store to the Redux DevTools Extension.
 *
 * All stores within the same registry (StoreProvider) share a single
 * DevTools connection (`@usels`), so cross-store actions and state
 * changes are visible in one unified timeline.
 */
export function connectDevTools(
  name: string,
  _store: Record<string, unknown>,
  value: StoreRegistryValue
): void {
  if (!isClient) return;

  const ext = window.__REDUX_DEVTOOLS_EXTENSION__;
  if (!ext) return;

  const { registry, actionTrackers } = value;
  let devtools = registryDevTools.get(registry);

  if (!devtools) {
    // First store: create connection and init
    const connection = ext.connect({ name: "@usels" });
    const unsubscribe = connection.subscribe((_message: unknown) => {
      // Time-travel and other DevTools messages can be handled here in the future
    });
    devtools = { connection, disposers: [unsubscribe] };
    registryDevTools.set(registry, devtools);
    connection.init(serializeRegistry(registry));
  } else {
    // Subsequent store: send update with new store added
    devtools.connection.send({ type: `@@INIT/${name}` }, serializeRegistry(registry));
  }

  // Bind action tracker dispatch to the shared connection
  const tracker = actionTrackers.get(name);
  if (tracker) {
    const { connection } = devtools;
    tracker.dispatch = (actionType: string) => {
      connection.send({ type: actionType }, serializeRegistry(registry));
    };
  }

  // Track state changes outside of actions (e.g. async query results)
  const { connection } = devtools;
  let pendingStateUpdate = false;
  for (const [, val] of Object.entries(_store)) {
    if (!isObservable(val)) continue;
    const unsub = (val as { onChange(cb: () => void): () => void }).onChange(() => {
      if (tracker?.activeAction) return;
      if (pendingStateUpdate) return;
      pendingStateUpdate = true;
      queueMicrotask(() => {
        pendingStateUpdate = false;
        connection.send({ type: `${name}/__state` }, serializeRegistry(registry));
      });
    });
    devtools!.disposers.push(unsub);
  }
}

/**
 * Tear down the DevTools connection for the given store registry.
 * Call this when the StoreProvider unmounts.
 */
export function cleanupDevTools(registry: Map<string, unknown>): void {
  const devtools = registryDevTools.get(registry);
  if (!devtools) return;

  for (const dispose of devtools.disposers) {
    dispose();
  }

  registryDevTools.delete(registry);
}
