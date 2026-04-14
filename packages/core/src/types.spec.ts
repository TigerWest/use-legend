import { describe, expectTypeOf, it } from "vitest";
import type { Observable } from "@legendapp/state";
import type { Show, For } from "@legendapp/state/react";
import type { ObservableProps, ReadonlyObservable, ShowIfProp } from "./types";

type ShowValueProp<T> = Pick<Observable<T>, "get">;
type ForEachProp<T> = Pick<
  Observable<T[] | Record<string | number, T> | Map<string | number, T>>,
  "get"
>;

describe("ObservableProps", () => {
  it("wraps non-children props in ReadonlyObservable", () => {
    interface Props {
      id: string;
      count?: number;
      enabled: boolean | undefined;
      children?: string | { node: true };
    }

    type InputProps = ObservableProps<Props>;

    expectTypeOf<InputProps["id"]>().toEqualTypeOf<ReadonlyObservable<string>>();
    expectTypeOf<InputProps["count"]>().toEqualTypeOf<
      ReadonlyObservable<number | undefined> | undefined
    >();
    expectTypeOf<InputProps["enabled"]>().toEqualTypeOf<ReadonlyObservable<boolean | undefined>>();
  });

  it("preserves children as the original type", () => {
    interface Props {
      title: string;
      children?: string | { node: true };
    }

    type InputProps = ObservableProps<Props>;

    expectTypeOf<InputProps["children"]>().toEqualTypeOf<Props["children"]>();
    expectTypeOf<InputProps["children"]>().not.toEqualTypeOf<
      ReadonlyObservable<string | { node: true } | undefined>
    >();
  });

  it("preserves additional plain keys when requested", () => {
    interface Props {
      title: string;
      onClick: () => void;
      children?: string;
    }

    type InputProps = ObservableProps<Props, "children" | "onClick">;

    expectTypeOf<InputProps["title"]>().toEqualTypeOf<ReadonlyObservable<string>>();
    expectTypeOf<InputProps["onClick"]>().toEqualTypeOf<Props["onClick"]>();
    expectTypeOf<InputProps["children"]>().toEqualTypeOf<Props["children"]>();
  });

  it("accepts observables for non-children props", () => {
    interface Props {
      title: string;
      selected: boolean;
      children?: string;
    }

    type InputProps = ObservableProps<Props>;

    expectTypeOf<Observable<string>>().toExtend<InputProps["title"]>();
    expectTypeOf<Observable<boolean>>().toExtend<InputProps["selected"]>();
    expectTypeOf<string>().not.toExtend<InputProps["title"]>();
    expectTypeOf<boolean>().not.toExtend<InputProps["selected"]>();
  });
});

// ---------------------------------------------------------------------------
// Show — augmented module types
// ---------------------------------------------------------------------------
// Show only calls .get() on its if/ifReady/$value props at runtime.
// The augmented overloads narrow the required shape to Pick<Observable<T>, 'get'>.
// ---------------------------------------------------------------------------

describe("Show() — augmented if/ifReady prop types", () => {
  it("Observable<T> satisfies ShowIfProp", () => {
    expectTypeOf<Observable<boolean>>().toExtend<ShowIfProp<boolean>>();
  });

  it("ReadonlyObservable<T> satisfies ShowIfProp — no set/delete needed", () => {
    expectTypeOf<ReadonlyObservable<boolean>>().toExtend<ShowIfProp<boolean>>();
  });

  it("Pick<Observable<T>, 'get'> satisfies ShowIfProp — minimal shape", () => {
    expectTypeOf<Pick<Observable<boolean>, "get">>().toExtend<ShowIfProp<boolean>>();
  });

  it("() => T satisfies ShowIfProp — function form", () => {
    expectTypeOf<() => boolean>().toExtend<ShowIfProp<boolean>>();
  });

  it("plain T satisfies ShowIfProp — raw value form", () => {
    expectTypeOf<boolean>().toExtend<ShowIfProp<boolean>>();
  });

  it("object without get() does not satisfy ShowIfProp", () => {
    // @ts-expect-error — { set } is missing get(), fails Pick<Observable<T>, 'get'>
    const _: ShowIfProp<boolean> = { set: (_: boolean) => {} };
  });

  it("Show is callable with Observable<T> for if prop", () => {
    expectTypeOf<typeof Show<boolean>>().toBeCallableWith({
      if: {} as Observable<boolean>,
      children: null,
    });
  });

  it("Show is callable with ReadonlyObservable<T> for if prop", () => {
    expectTypeOf<typeof Show<boolean>>().toBeCallableWith({
      if: {} as ReadonlyObservable<boolean>,
      children: null,
    });
  });

  it("Show is callable with () => T for if prop", () => {
    expectTypeOf<typeof Show<boolean>>().toBeCallableWith({
      if: (): boolean => true,
      children: null,
    });
  });

  it("Show is callable with ifReady instead of if", () => {
    expectTypeOf<typeof Show<boolean>>().toBeCallableWith({
      ifReady: {} as ReadonlyObservable<boolean>,
      children: null,
    });
  });

  it("Show rejects if and ifReady used simultaneously", () => {
    type ShowProps = Parameters<typeof Show>[0];
    // @ts-expect-error — if and ifReady cannot coexist (PropsIf sets ifReady?: never)
    const _: ShowProps = { if: true, ifReady: {} as Observable<boolean>, children: null };
  });
});

describe("Show() — augmented $value prop type", () => {
  it("Observable<T> satisfies ShowValueProp", () => {
    expectTypeOf<Observable<boolean>>().toExtend<ShowValueProp<boolean>>();
  });

  it("ReadonlyObservable<T> satisfies ShowValueProp", () => {
    expectTypeOf<ReadonlyObservable<boolean>>().toExtend<ShowValueProp<boolean>>();
  });

  it("Pick<Observable<T>, 'get'> satisfies ShowValueProp", () => {
    expectTypeOf<Pick<Observable<boolean>, "get">>().toExtend<ShowValueProp<boolean>>();
  });

  it("plain T does not satisfy ShowValueProp — no get() method", () => {
    // @ts-expect-error — boolean primitive has no get() method
    const _: ShowValueProp<boolean> = true;
  });
});

// ---------------------------------------------------------------------------
// For — augmented module types
// ---------------------------------------------------------------------------
// For calls each.get(trackingType) to read the collection at runtime.
// The augmented overload narrows the required shape to Pick<Observable<...>, 'get'>.
// ---------------------------------------------------------------------------

describe("For() — augmented each prop type", () => {
  it("Observable<T[]> satisfies ForEachProp", () => {
    expectTypeOf<Observable<boolean[]>>().toExtend<ForEachProp<boolean>>();
  });

  it("ReadonlyObservable<T[]> satisfies ForEachProp — no set/delete needed", () => {
    expectTypeOf<ReadonlyObservable<boolean[]>>().toExtend<ForEachProp<boolean>>();
  });

  it("Pick<Observable<T[]>, 'get'> satisfies ForEachProp — minimal shape", () => {
    expectTypeOf<Pick<Observable<boolean[]>, "get">>().toExtend<ForEachProp<boolean>>();
  });

  it("For is callable with Observable<T[]> for each prop", () => {
    expectTypeOf<typeof For<boolean, object>>().toBeCallableWith({
      each: {} as Observable<boolean[]>,
      children: (_value: Observable<boolean>) => null as unknown as import("react").ReactElement,
    });
  });

  it("For is callable with ReadonlyObservable<T[]> for each prop", () => {
    expectTypeOf<typeof For<boolean, object>>().toBeCallableWith({
      each: {} as ReadonlyObservable<boolean[]>,
      children: (_value: Observable<boolean>) => null as unknown as import("react").ReactElement,
    });
  });
});
