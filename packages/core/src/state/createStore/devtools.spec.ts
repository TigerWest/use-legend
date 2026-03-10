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

  describe("__state tracking", () => {
    it("sends __state when observable changes outside an action", async () => {
      const value = createTestValue();
      const store = { count$: observable(0) };
      value.registry.set("store", store);
      value.actionTrackers.set("store", { activeAction: null, dispatch: null });

      connectDevTools("store", store, value);
      mockConnection.send.mockClear();

      store.count$.set(5);

      // microtask debounce
      await Promise.resolve();

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith(
        { type: "store/__state" },
        { store: { count$: 5 } }
      );
    });

    it("does not send __state when change is inside an action", async () => {
      const value = createTestValue();
      const store = { count$: observable(0) };
      const tracker = {
        activeAction: null as string | null,
        dispatch: null as ((type: string) => void) | null,
      };
      value.registry.set("store", store);
      value.actionTrackers.set("store", tracker);

      connectDevTools("store", store, value);
      mockConnection.send.mockClear();

      tracker.activeAction = "store/increment";
      store.count$.set(1);
      tracker.activeAction = null;

      await Promise.resolve();

      expect(mockConnection.send).not.toHaveBeenCalled();
    });

    it("batches multiple synchronous changes into one __state", async () => {
      const value = createTestValue();
      const store = { a$: observable(0), b$: observable("x") };
      value.registry.set("store", store);
      value.actionTrackers.set("store", { activeAction: null, dispatch: null });

      connectDevTools("store", store, value);
      mockConnection.send.mockClear();

      store.a$.set(1);
      store.b$.set("y");

      await Promise.resolve();

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith(
        { type: "store/__state" },
        { store: { a$: 1, b$: "y" } }
      );
    });

    it("cleanup disposes onChange listeners", async () => {
      const value = createTestValue();
      const store = { count$: observable(0) };
      value.registry.set("store", store);
      value.actionTrackers.set("store", { activeAction: null, dispatch: null });

      connectDevTools("store", store, value);
      cleanupDevTools(value.registry);
      mockConnection.send.mockClear();

      store.count$.set(99);
      await Promise.resolve();

      expect(mockConnection.send).not.toHaveBeenCalled();
    });
  });
});
