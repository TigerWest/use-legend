// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { createStore, StoreProvider, __resetStoreDefinitions } from ".";
import { useScope } from "../useScope";

beforeEach(() => {
  __resetStoreDefinitions();
});

afterEach(() => {
  cleanup();
});

describe("getStore() inside useScope factory", () => {
  it("resolves store from the nearest <StoreProvider> registry", () => {
    const [, getCounter] = createStore("counter", () => ({ count$: observable(0) }));

    let captured: ReturnType<typeof getCounter> | null = null;

    function Child() {
      useScope(() => {
        captured = getCounter();
        return {};
      });
      return null;
    }

    render(
      <StoreProvider>
        <Child />
      </StoreProvider>
    );

    expect(captured).not.toBeNull();
    expect(captured!.count$.get()).toBe(0);
  });

  it("returns the same store instance across multiple useScope consumers under one provider", () => {
    const [, getShared] = createStore("shared", () => ({ value$: observable(42) }));

    const seen: Array<ReturnType<typeof getShared>> = [];

    function Consumer() {
      useScope(() => {
        seen.push(getShared());
        return {};
      });
      return null;
    }

    render(
      <StoreProvider>
        <Consumer />
        <Consumer />
      </StoreProvider>
    );

    expect(seen.length).toBe(2);
    expect(seen[0] === seen[1]).toBe(true);
  });

  it("throws when getStore() is called outside any provider/scope", () => {
    const [, getOrphan] = createStore("orphan", () => ({}));
    expect(() => getOrphan()).toThrow(/must be called inside|must be used within/);
  });

  it("throws when getStore() is called inside useScope without a <StoreProvider>", () => {
    const [, getNoProvider] = createStore("no-provider-scope", () => ({}));

    function Child() {
      useScope(() => {
        getNoProvider();
        return {};
      });
      return null;
    }

    class Boundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
      state: { err: Error | null } = { err: null };
      static getDerivedStateFromError(err: Error) {
        return { err };
      }
      render() {
        return this.state.err ? (
          <div data-testid="err">{this.state.err.message}</div>
        ) : (
          this.props.children
        );
      }
    }

    const { getByTestId } = render(
      <Boundary>
        <Child />
      </Boundary>
    );
    expect(getByTestId("err").textContent).toMatch(
      /must be used within a <StoreProvider>|must be called inside/
    );
  });

  it("re-subscribes to StoreRegistryContext when the provider remounts (new store instance)", () => {
    const [, getSwap] = createStore("swap", () => ({ tag$: observable(Math.random()) }));

    const seen: Array<ReturnType<typeof getSwap>> = [];

    function Consumer() {
      useScope(() => {
        seen.push(getSwap());
        return {};
      });
      return null;
    }

    const { rerender, unmount } = render(
      <StoreProvider key="A">
        <Consumer />
      </StoreProvider>
    );

    expect(seen.length).toBe(1);

    // Different `key` forces a fresh <StoreProvider> with its own registry.
    // Each render must reset store definitions because createStore registers by name.
    __resetStoreDefinitions();
    createStore("swap", () => ({ tag$: observable(Math.random()) }));

    rerender(
      <StoreProvider key="B">
        <Consumer />
      </StoreProvider>
    );

    expect(seen.length).toBe(2);
    expect(seen[0] === seen[1]).toBe(false);

    unmount();
  });
});
