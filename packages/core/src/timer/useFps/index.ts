"use client";
import { useScope } from "@primitives/useScope";
import { peek } from "@utilities/peek";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";
import { createFps, type FpsOptions } from "./core";

export { createFps } from "./core";
export type { FpsOptions } from "./core";

export type UseFpsOptions = Pick<FpsOptions, "every">;

export function useFps(options?: DeepMaybeObservable<UseFpsOptions>): ReadonlyObservable<number> {
  const rawOpts = peek(options);
  const every = rawOpts?.every ?? 10;

  return useScope(() => {
    const result = createFps({ every });
    return result.fps$ as ReadonlyObservable<number>;
  });
}
