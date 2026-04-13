"use client";
import { useScope, toObs } from "@usels/core";
import { createInfiniteScroll } from "./core";

export { createInfiniteScroll } from "./core";
export type {
  UseInfiniteScrollDirection,
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
} from "./core";

export type UseInfiniteScroll = typeof createInfiniteScroll;
export const useInfiniteScroll: UseInfiniteScroll = (element, onLoadMore, options) => {
  return useScope(
    (p, opts) => {
      const opts$ = toObs(opts, { canLoadMore: "function", window: "opaque" });
      return createInfiniteScroll(
        element,
        (...args) => p.onLoadMore?.(...args),
        opts$
      );
    },
    { onLoadMore },
    (options ?? {}) as Record<string, unknown>
  );
};
