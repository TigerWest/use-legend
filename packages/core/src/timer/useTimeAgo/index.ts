"use client";
import { useScope, toObs } from "@primitives/useScope";
import { createTimeAgo } from "./core";

export { createTimeAgo, formatTimeAgo } from "./core";
export type { UseTimeAgoUnitNamesDefault, FormatTimeAgoOptions, TimeAgoOptions } from "./core";

export type UseTimeAgo = typeof createTimeAgo;

export const useTimeAgo: UseTimeAgo = (time, options = {}) => {
  return useScope(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- createTimeAgo has discriminated overloads on controls: true/false
    (opts): any => createTimeAgo(time, toObs(opts, { fullDateFormatter: "function" }) as any),
    options
  );
};
