"use client";
import { useScope } from "@primitives/useScope";
import type { Pausable } from "../../types";
import { createRafFn } from "./core";
import type { RafFnCallbackArguments, RafFnOptions } from "./core";

export { createRafFn } from "./core";
export type { RafFnCallbackArguments, RafFnOptions } from "./core";

export type UseRafFnCallbackArguments = RafFnCallbackArguments;
export type UseRafFnOptions = RafFnOptions;

export type UseRafFn = (
  fn: (args: RafFnCallbackArguments) => void,
  options?: RafFnOptions
) => Pausable;

export const useRafFn: UseRafFn = (fn, options) => {
  return useScope(
    (p) => {
      return createRafFn((args) => (p.fn as (args: RafFnCallbackArguments) => void)(args), options);
    },
    { fn }
  );
};
