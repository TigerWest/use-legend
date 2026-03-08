"use client";
import { useMount } from "@legendapp/state/react";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createFps, type FpsOptions } from "./core";

export { createFps } from "./core";
export type { FpsOptions } from "./core";

export type UseFpsOptions = Pick<FpsOptions, "every">;

export function useFps(options?: DeepMaybeObservable<UseFpsOptions>): ReadonlyObservable<number> {
  const opts$ = useMaybeObservable(options);
  const every = opts$.peek()?.every ?? 10;

  const result = useConstant(() => createFps({ every, immediate: false }));

  useMount(() => {
    result.resume();
    return () => result.dispose();
  });

  return result.fps$ as ReadonlyObservable<number>;
}
