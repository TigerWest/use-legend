"use client";
import { useScope, toObs, get, peek, type DeepMaybeObservable, Observable } from "@usels/core";
import { useQueryClient } from "../useQueryClient";
import { resolveQueryKey } from "../keyResolvers";
import { createQuery, type CreateQueryOptions, type QueryState } from "./core";

export type { CreateQueryOptions, QueryState } from "./core";
export { createQuery } from "./core";

/**
 * UseQueryOptions is an alias for CreateQueryOptions for backward compatibility.
 */
export type UseQueryOptions<TData = unknown> = CreateQueryOptions<TData>;

/**
 * Custom hook that bridges TanStack Query with Legend-State.
 * Manages query state as an observable using QueryObserver.
 *
 * Accepts `DeepMaybeObservable<CreateQueryOptions>`, supporting an Observable
 * for the entire options object or for individual fields. Elements inside
 * the queryKey array can also be Observables and will react to changes automatically.
 *
 * @example
 * ```tsx
 * const products$ = useQuery({
 *   queryKey: ['products'],
 *   queryFn: () => fetch('/api/products').then(r => r.json())
 * })
 * ```
 */
export type UseQuery = typeof createQuery;

export const useQuery: UseQuery = <TData = unknown>(
  options?: DeepMaybeObservable<CreateQueryOptions<TData>>
): Observable<QueryState<TData>> => {
  const queryClient = useQueryClient();

  const state$ = useScope(
    (opts) => {
      // queryKey stays untagged so resolveQueryKey handles Observable elements directly.
      const opts$ = toObs(opts, { queryFn: "function" }) as unknown as Observable<
        CreateQueryOptions<TData>
      >;
      return createQuery<TData>(opts$);
    },
    (options ?? {}) as Record<string, unknown>
  ) as Observable<QueryState<TData>>;

  // Suspense handling (React-specific) stays in the hook.
  const rawOpts = peek(options) as CreateQueryOptions<TData> | undefined;
  const suspense = get(rawOpts?.suspense) ?? false;

  if (suspense && (state$ as unknown as Observable<QueryState>).isPending.peek()) {
    throw queryClient.fetchQuery({
      queryKey: resolveQueryKey(rawOpts?.queryKey ?? []),
      queryFn: rawOpts?.queryFn,
    });
  }

  return state$;
};
