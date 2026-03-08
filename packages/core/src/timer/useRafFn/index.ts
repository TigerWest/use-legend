"use client";
import { useMount } from "@legendapp/state/react";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import type { Pausable } from "../../types";
import { rafFn } from "./core";
import type { RafFnCallbackArguments, RafFnOptions } from "./core";

export { rafFn } from "./core";
export type { RafFnCallbackArguments, RafFnOptions } from "./core";

export type UseRafFnCallbackArguments = RafFnCallbackArguments;
export type UseRafFnOptions = RafFnOptions;

export function useRafFn(
  fn: (args: RafFnCallbackArguments) => void,
  options?: RafFnOptions
): Pausable {
  const fnRef = useLatest(fn);

  const result = useConstant(() =>
    rafFn((args) => fnRef.current(args), { ...options, immediate: false })
  );

  useMount(() => {
    if (options?.immediate ?? true) result.resume();
    return () => result.dispose();
  });

  return { isActive$: result.isActive$, pause: result.pause, resume: result.resume };
}
