"use client";
import { type Observable } from "@legendapp/state";
import { useScope, toObs } from "@primitives/useScope";
import type { AnyFn } from "../../types";
import { createTimeoutFn } from "./core";

export { createTimeoutFn } from "./core";
export type { TimeoutFnOptions } from "./core";

export type UseTimeoutFn = typeof createTimeoutFn;

export const useTimeoutFn: UseTimeoutFn = (cb, interval, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p, { cb: "function" });
      return createTimeoutFn(
        (...args: unknown[]) => (p.cb as AnyFn)(...args),
        p$.interval as Observable<number>,
        options
      );
    },
    { cb, interval }
  );
};
