import { describe, expectTypeOf, it } from "vitest";
import type { Observable } from "@legendapp/state";
import type { ObservableProps, ReadonlyObservable } from "./types";

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

    expectTypeOf<Observable<string>>().toMatchTypeOf<InputProps["title"]>();
    expectTypeOf<Observable<boolean>>().toMatchTypeOf<InputProps["selected"]>();
    expectTypeOf<string>().not.toMatchTypeOf<InputProps["title"]>();
    expectTypeOf<boolean>().not.toMatchTypeOf<InputProps["selected"]>();
  });
});
