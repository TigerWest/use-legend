"use client";
import React, {
  createElement,
  type FC,
  type ReactNode,
  type ReactElement,
} from "react";
import { Computed, Memo, Show } from "@legendapp/state/react";
import type { Selector } from "@legendapp/state";

type AutoPropsIf<T> = {
  if: Selector<T>;
  ifReady?: never;
  withState?: boolean; // Show is already reactive to parent state; withState is accepted but has no effect
  children: () => ReactNode;
  else?: ReactNode | (() => ReactNode);
  wrap?: FC<{ children: ReactNode }>;
};

type AutoPropsIfReady<T> = {
  if?: never;
  ifReady: Selector<T>;
  withState?: boolean; // Same as above
  children: () => ReactNode;
  else?: ReactNode | (() => ReactNode);
  wrap?: FC<{ children: ReactNode }>;
};

type AutoPropsReactive = {
  if?: never;
  ifReady?: never;
  withState?: boolean;
  children: () => ReactNode;
};

export type AutoProps<T = unknown> =
  | AutoPropsIf<T>
  | AutoPropsIfReady<T>
  | AutoPropsReactive;

export function Auto<T>({
  if: ifProp,
  ifReady,
  withState,
  children,
  ...rest
}: AutoProps<T>): ReactElement | null {
  if (ifProp !== undefined) {
    const { else: elseProp, wrap } = rest as AutoPropsIf<T>;
    return createElement(Show<T>, {
      if: ifProp,
      else: elseProp,
      wrap,
      children,
    });
  }
  if (ifReady !== undefined) {
    const { else: elseProp, wrap } = rest as AutoPropsIfReady<T>;
    return createElement(Show<T>, { ifReady, else: elseProp, wrap, children });
  }
  return createElement(
    withState ? Computed : React.memo(Computed, () => true),
    { children },
  );
}
