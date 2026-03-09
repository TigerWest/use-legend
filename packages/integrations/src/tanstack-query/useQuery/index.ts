"use client";
import { useUnmount } from "@legendapp/state/react";
import type { Observable } from "@legendapp/state";
import { get, type DeepMaybeObservable, useMaybeObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { useQueryClient } from "../useQueryClient";
import { createQuery, type CreateQueryOptions, type QueryState } from "./core";

export type { CreateQueryOptions, QueryState } from "./core";
export { createQuery } from "./core";

/**
 * UseQueryOptions is an alias for CreateQueryOptions for backward compatibility.
 * The hook accepts the same options as the core function.
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
 * // Plain values
 * const products$ = useQuery({
 *   queryKey: ['products'],
 *   queryFn: () => fetch('/api/products').then(r => r.json())
 * })
 *
 * // Observable element in queryKey array
 * const id$ = observable('1')
 * const user$ = useQuery({
 *   queryKey: ['users', id$],
 *   queryFn: () => fetchUser(id$.peek()),
 * })
 * // Automatically re-fetches when id$ changes.
 * // Cache is accessible via queryClient.getQueryData(['users', '1'])
 *
 * // Observable inside a nested object in queryKey
 * const filter$ = observable({ category: 'electronics' })
 * const list$ = useQuery({
 *   queryKey: ['products', { filter: filter$.category }],
 *   queryFn: () => fetchProducts(filter$.category.peek()),
 * })
 *
 * // Per-field Observable options
 * const enabled$ = observable(false)
 * const data$ = useQuery({
 *   queryKey: ['test'],
 *   queryFn: fetchData,
 *   enabled: enabled$,
 * })
 * ```
 */
export function useQuery<TData = unknown>(
  options: DeepMaybeObservable<CreateQueryOptions<TData>>
): Observable<QueryState<TData>> {
  const queryClient = useQueryClient();

  // Normalize DeepMaybeObservable<CreateQueryOptions> into a stable computed Observable.
  // - 'function' for queryFn: prevents Legend-State from treating it as a child observable
  // - 'default' (omitted) for other fields: Observables are kept as-is in the result,
  //   so that get(opts.enabled) inside observe() explicitly registers the dep
  // - queryKey is NOT listed here: resolveQueryKey handles Observable elements directly
  const opts$ = useMaybeObservable<CreateQueryOptions<TData>>(
    options as DeepMaybeObservable<CreateQueryOptions<TData>>,
    {
      queryFn: "function",
    }
  );

  const { state$, observer, dispose } = useConstant(() =>
    createQuery<TData>(
      queryClient,

      opts$ as unknown as Observable<CreateQueryOptions<TData>>
    )
  );

  useUnmount(dispose);

  // Suspense handling (React-specific) stays in the hook.
  // Reads current result at render time without registering reactive deps.
  const renderOpts = opts$.peek();
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
