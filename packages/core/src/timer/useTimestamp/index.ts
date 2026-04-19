"use client";
import { useScope, toObs } from "@primitives/useScope";
import { createTimestamp } from "./core";

export { createTimestamp } from "./core";
export type { TimestampOptions } from "./core";

export type UseTimestamp = typeof createTimestamp;

export const useTimestamp: UseTimestamp = (options = {}) => {
  return useScope(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- createTimestamp has discriminated overloads on controls: true/false
    (opts): any => createTimestamp(toObs(opts) as any),
    options
  );
};
