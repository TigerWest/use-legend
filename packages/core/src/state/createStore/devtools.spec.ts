// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import type { StoreRegistryValue } from ".";
import { __resetStoreDefinitions } from ".";
import { connectDevTools, cleanupDevTools } from "./devtools";

beforeEach(() => {
  __resetStoreDefinitions();
});

function createTestValue(): StoreRegistryValue {
  return {
    registry: new Map<string, unknown>(),
    devtools: false,
    actionTrackers: new Map(),
  };
}

describe("devtools", () => {
  let mockConnection: {
    init: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockConnection = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    };
    window.__REDUX_DEVTOOLS_EXTENSION__ = {
      connect: vi.fn(() => mockConnection),
    } as unknown as typeof window.__REDUX_DEVTOOLS_EXTENSION__;
  });

  afterEach(() => {
    delete (window as Window & { __REDUX_DEVTOOLS_EXTENSION__?: unknown })
      .__REDUX_DEVTOOLS_EXTENSION__;
  });

  it("init is called when connectDevTools is invoked", () => {
    const value = createTestValue();
    const store = { count$: observable(0) };
    value.registry.set("dt-init", store);

    connectDevTools("dt-init", store, value);

    expect(mockConnection.init).toHaveBeenCalledTimes(1);
  });

  it("cleanupDevTools disposes all observers without error", () => {
    const value = createTestValue();
    const store = { count$: observable(0) };
    value.registry.set("dt-cleanup", store);

    connectDevTools("dt-cleanup", store, value);

    expect(() => cleanupDevTools(value.registry)).not.toThrow();
  });

  it("subscribe is called to listen for DevTools messages", () => {
    const value = createTestValue();
    const store = { value$: observable("hello") };
    value.registry.set("dt-subscribe", store);

    connectDevTools("dt-subscribe", store, value);

    expect(mockConnection.subscribe).toHaveBeenCalledTimes(1);
  });
});
