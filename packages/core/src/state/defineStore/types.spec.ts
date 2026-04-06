// @vitest-environment jsdom
import { describe, it, expectTypeOf } from "vitest";
import { createStore, StoreProvider, __resetStoreDefinitions } from ".";
import type { StoreState, StoreActions } from ".";
import type { Observable } from "@legendapp/state";
import type { ReadonlyObservable } from "../../types";

describe("createStore() — types", () => {
  describe("return type", () => {
    it("returns a function (hook)", () => {
      const useStore = createStore("t1", () => ({ value$: {} as Observable<number> }));
      expectTypeOf(useStore).toBeFunction();
    });

    it("hook return type matches setup return type", () => {
      const useStore = createStore("t2", () => ({
        count$: {} as Observable<number>,
        name$: {} as Observable<string>,
      }));
      expectTypeOf(useStore).returns.toEqualTypeOf<{
        count$: Observable<number>;
        name$: Observable<string>;
      }>();
    });

    it("infers complex return types", () => {
      const useStore = createStore("t3", () => {
        const increment = () => {};
        return {
          value$: {} as Observable<number>,
          increment,
          nested: { deep: true },
        };
      });

      expectTypeOf(useStore).returns.toHaveProperty("value$");
      expectTypeOf(useStore).returns.toHaveProperty("increment");
      expectTypeOf(useStore).returns.toHaveProperty("nested");
    });
  });

  describe("StoreProvider", () => {
    it("StoreProvider accepts children prop", () => {
      expectTypeOf(StoreProvider).toBeCallableWith({
        children: null,
      });
    });
  });

  describe("generic inference", () => {
    it("rejects non-object setup return", () => {
      // @ts-expect-error — primitive return is not assignable to Record<string, unknown>
      createStore("t4", () => "hello" as const);
    });

    it("infers object shape from setup", () => {
      const useStore = createStore("t5", () => ({
        a$: {} as Observable<number>,
        b$: {} as Observable<string>,
        reset: () => {},
      }));
      expectTypeOf(useStore).returns.toHaveProperty("a$");
      expectTypeOf(useStore).returns.toHaveProperty("b$");
      expectTypeOf(useStore).returns.toHaveProperty("reset");
    });
  });

  describe("StoreState / StoreActions utility types", () => {
    type TestStore = {
      count$: Observable<number>;
      name$: ReadonlyObservable<string>;
      increment: () => void;
      reset: (value: number) => void;
      label: string;
    };

    it("StoreState extracts observable and readonly-observable fields", () => {
      expectTypeOf<StoreState<TestStore>>().toEqualTypeOf<{
        count$: Observable<number>;
        name$: ReadonlyObservable<string>;
      }>();
    });

    it("StoreActions extracts non-observable function fields", () => {
      expectTypeOf<StoreActions<TestStore>>().toEqualTypeOf<{
        increment: () => void;
        reset: (value: number) => void;
      }>();
    });

    it("StoreActions excludes observables even though they are callable", () => {
      type Store = {
        count$: Observable<number>;
        doSomething: () => void;
      };
      type Actions = StoreActions<Store>;
      expectTypeOf<Actions>().toEqualTypeOf<{ doSomething: () => void }>();
    });
  });
});
