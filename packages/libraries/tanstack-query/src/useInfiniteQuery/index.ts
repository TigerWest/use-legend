"use client";
import { QueryKey, InfiniteData } from "@tanstack/query-core";
import { useScope, toObs, get, peek, type DeepMaybeObservable, Observable } from "@usels/core";
import { useQueryClient } from "../useQueryClient";
import { resolveQueryKey } from "../keyResolvers";
import {
  createInfiniteQuery,
  type CreateInfiniteQueryOptions,
  type InfiniteQueryState,
} from "./core";

export type { CreateInfiniteQueryOptions, InfiniteQueryState } from "./core";
export { createInfiniteQuery } from "./core";

/**
 * UseInfiniteQueryOptions is an alias for CreateInfiniteQueryOptions for backward compatibility.
 */
export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;

/**
 * Connects TanStack Query Infinite Query with Legend-State observables.
 * Uses InfiniteQueryObserver to manage query state as observables.
 */
export type UseInfiniteQuery = typeof createInfiniteQuery;

export const useInfiniteQuery: UseInfiniteQuery = <
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options?: DeepMaybeObservable<CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>>
): Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> => {
  type InfiniteOpts = CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;
  const queryClient = useQueryClient();

  const state$ = useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        queryFn: "function",
        getNextPageParam: "function",
        getPreviousPageParam: "function",
      }) as unknown as Observable<InfiniteOpts>;
      return createInfiniteQuery<TQueryFnData, TQueryKey, TPageParam>(opts$);
    },
    (options ?? {}) as Record<string, unknown>
  ) as Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>>;

  // Suspense handling (React-specific) stays in the hook.
  const rawOpts = peek(options) as InfiniteOpts | undefined;
  const suspense = get(rawOpts?.suspense) ?? false;

  if (suspense && (state$ as unknown as Observable<InfiniteQueryState>).isPending.peek()) {
    throw queryClient.fetchInfiniteQuery({
      queryKey: resolveQueryKey(rawOpts?.queryKey ?? []) as TQueryKey,
      queryFn: rawOpts?.queryFn,
      initialPageParam: rawOpts?.initialPageParam as TPageParam,
      getNextPageParam: rawOpts?.getNextPageParam,
    });
  }

  return state$;
};
