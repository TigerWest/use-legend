"use client";
import { useMount } from "@legendapp/state/react";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import type { AnyFn, MaybeObservable, Stoppable } from "../../types";
import { get } from "@utilities/get";
import { createTimeoutFn } from "./core";

export { createTimeoutFn } from "./core";
export type { TimeoutFnOptions } from "./core";

export type UseTimeoutFnOptions = import("./core").TimeoutFnOptions;

export function useTimeoutFn<CallbackFn extends AnyFn>(
  cb: CallbackFn,
  interval: MaybeObservable<number>,
  options?: UseTimeoutFnOptions
): Stoppable<Parameters<CallbackFn> | []> {
  const cbRef = useLatest(cb);
  const intervalRef = useLatest(interval);

  const result = useConstant(() =>
    createTimeoutFn<CallbackFn>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forwarding variadic args to callback
      ((...args: any[]) => cbRef.current(...args)) as CallbackFn,
      () => get(intervalRef.current) as number,
      { ...options, immediate: false }
    )
  );

  useMount(() => {
    if (options?.immediate ?? true) result.start();
    return () => result.dispose();
  });

  return { isPending$: result.isPending$, stop: result.stop, start: result.start };
}
