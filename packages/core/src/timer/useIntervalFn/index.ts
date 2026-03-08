"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import type { AnyFn, MaybeObservable, Pausable } from "../../types";
import { createIntervalFn } from "./core";
import type { IntervalFnOptions } from "./core";

export { createIntervalFn } from "./core";
export type { IntervalFnOptions } from "./core";

export type UseIntervalFnOptions = IntervalFnOptions;

export function useIntervalFn(
  cb: AnyFn,
  interval: MaybeObservable<number> = 1000,
  options?: IntervalFnOptions
): Pausable {
  const interval$ = useMaybeObservable(interval);
  const cbRef = useLatest(cb);

  const result = useConstant(() =>
    createIntervalFn(
      (...args: unknown[]) => cbRef.current(...args),
      interval$ as unknown as Observable<number>,
      { ...options, immediate: false }
    )
  );

  useMount(() => {
    if (options?.immediate ?? true) result.resume();
    return () => result.dispose();
  });

  return { isActive$: result.isActive$, pause: result.pause, resume: result.resume };
}
