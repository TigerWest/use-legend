"use client";
import { useUnmount } from "@legendapp/state/react";
import { QueryKey, InfiniteData } from "@tanstack/query-core";
import type { Observable } from "@legendapp/state";
import { get, type DeepMaybeObservable, useMaybeObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { useQueryClient } from "../useQueryClient";
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
 *
 * Accepts Observable values as parameters and automatically refetches on change.
 *
 * @example
 * ```tsx
 * // Cursor-based pagination
 * const items$ = useInfiniteQuery({
 *   queryKey: ['items'],
 *   queryFn: ({ pageParam }) =>
 *     fetch(`/api/items?cursor=${pageParam}`).then(r => r.json()),
 *   initialPageParam: undefined,
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * })
 *
 * // Observable reactivity
 * const filter$ = useObservable({ category: 'electronics' })
 * const items$ = useInfiniteQuery({
 *   queryKey: ['items', filter$],
 *   queryFn: ({ pageParam }) =>
 *     fetch(`/api/items?category=${filter$.category.get()}&cursor=${pageParam}`)
 *       .then(r => r.json()),
 *   initialPageParam: undefined,
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * })
 * ```
 */
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DeepMaybeObservable<CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>>
): Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> {
  type InfiniteOpts = CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;

  const queryClient = useQueryClient();

  const opts$ = useMaybeObservable<InfiniteOpts>(options as DeepMaybeObservable<InfiniteOpts>, {
    queryFn: "function",
    getNextPageParam: "function",
    getPreviousPageParam: "function",
  });

  const { state$, observer, dispose } = useConstant(() =>
    createInfiniteQuery<TQueryFnData, TQueryKey, TPageParam>(
      queryClient,

      opts$ as unknown as Observable<InfiniteOpts>
    )
  );

  useUnmount(dispose);

  // Suspense handling (React-specific) stays in the hook.
  const renderOpts = opts$.peek() as InfiniteOpts | undefined;
  const result = observer.getCurrentResult();
  const suspense = get(renderOpts?.suspense) ?? false;

  if (suspense && result.isPending) {
    throw (
      observer
        .fetchOptimistic(observer.options)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((optimisticResult: any) => optimisticResult.data)
    );
  }

  return state$;
}
