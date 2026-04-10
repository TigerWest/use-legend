"use client";
import { type Observable } from "@legendapp/state";
import { useScope, toObs } from "@primitives/useScope";
import type { AnyFn, MaybeObservable, Pausable } from "../../types";
import { createIntervalFn } from "./core";
import type { IntervalFnOptions } from "./core";

export { createIntervalFn } from "./core";
export type { IntervalFnOptions } from "./core";

export type UseIntervalFn = (
  cb: AnyFn,
  interval?: MaybeObservable<number>,
  options?: IntervalFnOptions
) => Pausable;

export const useIntervalFn: UseIntervalFn = (cb, interval = 1000, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p, { cb: "function" });
      return createIntervalFn(
        (...args: unknown[]) => (p.cb as AnyFn)(...args),
        p$.interval as Observable<number>,
        options
      );
    },
    { cb, interval }
  );
};
