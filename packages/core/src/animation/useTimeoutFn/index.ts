"use client";
import { useMount, useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type { AnyFn, MaybeObservable, Stoppable, TimerHandle } from "../../types";
import { get } from "../../function/get";

export interface UseTimeoutFnOptions {
  /** If true, calls start() immediately on mount. @default true */
  immediate?: boolean;
  /** If true, calls cb() immediately (no args) when start() is called, then again after the delay with the original args. @default false */
  immediateCallback?: boolean;
}

export function useTimeoutFn<CallbackFn extends AnyFn>(
  cb: CallbackFn,
  interval: MaybeObservable<number>,
  options?: UseTimeoutFnOptions
): Stoppable<Parameters<CallbackFn> | []> {
  const isPending$ = useObservable(false);
  const timer = useRef<TimerHandle>(undefined);
  const cbRef = useRef(cb);
  // eslint-disable-next-line react-hooks/refs -- intentional: storing latest function in ref during render (stable-ref pattern)
  cbRef.current = cb;

  const immediateCallback = options?.immediateCallback ?? false;

  const stop = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    isPending$.set(false);
  };

  const start = (...args: Parameters<CallbackFn> | []) => {
    stop();
    if (immediateCallback) cbRef.current();
    isPending$.set(true);
    const ms = get(interval);
    timer.current = setTimeout(() => {
      isPending$.set(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forwarding variadic args to callback
      cbRef.current(...(args as any));
    }, ms);
  };

  useMount(() => {
    if (options?.immediate ?? true) start();
    return () => stop();
  });

  return { isPending$, stop, start };
}
