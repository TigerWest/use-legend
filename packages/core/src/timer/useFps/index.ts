"use client";
import { useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type { DeepMaybeObservable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "../../function/useMaybeObservable";
import { useRafFn } from "../useRafFn";

export interface UseFpsOptions {
  /**
   * Sample FPS every N frames (reduces noise) — mount-time-only
   * @default 10
   */
  every?: number;
}

export function useFps(options?: DeepMaybeObservable<UseFpsOptions>): ReadonlyObservable<number> {
  // ✅ DeepMaybeObservable → normalize
  const opts$ = useMaybeObservable(options);

  // ✅ mount-time-only: opts$.peek()?.every — more robust than opts$.every.peek()
  // when options=undefined, the computed observable holds undefined and child observables may not exist
  const every = opts$.peek()?.every ?? 10;

  const fps$ = useObservable<number>(0);
  const lastRef = useRef<number | null>(null); // null = first frame not yet seen
  const ticksRef = useRef<number>(0);

  useRafFn(({ timestamp }) => {
    // Lazy-initialize on first frame using the rAF timestamp (avoids impure render call)
    if (lastRef.current === null) lastRef.current = timestamp;
    ticksRef.current += 1;
    if (ticksRef.current >= every) {
      const diff = timestamp - lastRef.current;
      fps$.set(Math.round(1000 / (diff / ticksRef.current)));
      lastRef.current = timestamp;
      ticksRef.current = 0;
    }
  });

  return fps$ as ReadonlyObservable<number>;
}
