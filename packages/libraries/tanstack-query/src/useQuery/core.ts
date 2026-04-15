
import { QueryObserver } from "@tanstack/query-core";
import {
  get,
  peek,
  observe,
  onUnmount,
  createIsMounted,
  observable,
  type Observable,
  type MaybeObservable,
  type DeepMaybeObservable,
} from "@usels/core";
import { getQueryClient } from "../useQueryClient";
import { resolveQueryKey } from "../keyResolvers";

export interface CreateQueryOptions<TData = unknown> {
  /**
   * Array whose elements can be plain values, Observables, or nested objects
   * containing Observables. e.g. `['users', id$]` or `['users', { id: id$ }]`.
   * The entire key can also be an Observable array.
   */
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  enabled?: MaybeObservable<boolean>;
  staleTime?: MaybeObservable<number>;
  gcTime?: MaybeObservable<number>;
  retry?: MaybeObservable<number | boolean>;
  refetchOnWindowFocus?: MaybeObservable<boolean>;
  refetchOnMount?: MaybeObservable<boolean>;
  refetchOnReconnect?: MaybeObservable<boolean>;
  throwOnError?: boolean | ((error: Error) => boolean);
  suspense?: MaybeObservable<boolean>;
}

export interface QueryState<TData = unknown> {
  data: TData | undefined;
  error: Error | null;
  status: "pending" | "error" | "success";
  fetchStatus: "fetching" | "paused" | "idle";
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isLoadingError: boolean;
  isRefetchError: boolean;
  isFetching: boolean;
  isPaused: boolean;
  isRefetching: boolean;
  isLoading: boolean;
  /**
   * @deprecated Use `isLoading` instead. Will be removed in TanStack Query v6.
   */
  isInitialLoading: boolean;
  isStale: boolean;
  isPlaceholderData: boolean;
  isFetched: boolean;
  isFetchedAfterMount: boolean;
  isEnabled: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
  failureReason: Error | null;
  errorUpdateCount: number;

  refetch: () => void;
}

/**
 * Core observable function for bridging TanStack Query with Legend-State.
 *
 * Must be called inside a scope (e.g. `useScope` factory or standalone `createScope`)
 * wrapped by a `QueryClientProvider` — `getQueryClient()` injects the client from
 * context. Reactive teardown is registered via `onUnmount`; option changes
 * (including Observable elements inside `queryKey`) are tracked via `observe`.
 *
 * @param options - Plain object, per-field Observable, or outer Observable of options.
 * @returns Observable reflecting query state (including `refetch`).
 */
export function createQuery<TData = unknown>(
  options?: DeepMaybeObservable<CreateQueryOptions<TData>>
): Observable<QueryState<TData>> {
  const queryClient = getQueryClient();
  const opts$ = observable(options);

  const initialOpts = opts$.peek();
  const initialQueryKey = resolveQueryKey(initialOpts?.queryKey ?? []);

  const observer = new QueryObserver<TData, Error>(queryClient, {
    queryKey: initialQueryKey,
    queryFn: initialOpts?.queryFn ?? (() => Promise.resolve(undefined as TData)),
    enabled: peek(initialOpts?.enabled) ?? true,
    staleTime: peek(initialOpts?.staleTime),
    gcTime: peek(initialOpts?.gcTime),
    retry: peek(initialOpts?.retry as MaybeObservable<number | boolean>),
    refetchOnWindowFocus: peek(initialOpts?.refetchOnWindowFocus),
    refetchOnMount: peek(initialOpts?.refetchOnMount),
    refetchOnReconnect: peek(initialOpts?.refetchOnReconnect),
    throwOnError: initialOpts?.throwOnError as never,
    suspense: peek(initialOpts?.suspense) ?? false,
  });

  const state$ = observable<QueryState<TData>>({
    data: undefined as TData | undefined,
    error: null as Error | null,
    status: "pending" as "pending" | "error" | "success",
    fetchStatus: "idle" as "fetching" | "paused" | "idle",
    isPending: true,
    isSuccess: false,
    isError: false,
    isLoadingError: false,
    isRefetchError: false,
    isFetching: false,
    isPaused: false,
    isRefetching: false,
    isLoading: true,
    isInitialLoading: true,
    isStale: true,
    isPlaceholderData: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isEnabled: peek(initialOpts?.enabled) ?? true,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null as Error | null,
    errorUpdateCount: 0,
    refetch() {
      observer.refetch();
    },
  });

  // React to option changes (including Observable elements inside queryKey).
  // Gate on isMounted$ — initial constructor call already set options; this
  // effect handles subsequent changes after mount.
  const isMounted$ = createIsMounted();
  observe(() => {
    const opts = opts$.get();
    if (!opts || !isMounted$.get()) return;

    const resolvedKey = resolveQueryKey(opts.queryKey ?? []);

    observer.setOptions({
      queryKey: resolvedKey,
      queryFn: opts.queryFn,
      enabled: get(opts.enabled) ?? true,
      staleTime: get(opts.staleTime),
      gcTime: get(opts.gcTime),
      retry: get(opts.retry as MaybeObservable<number | boolean>),
      refetchOnWindowFocus: get(opts.refetchOnWindowFocus),
      refetchOnMount: get(opts.refetchOnMount),
      refetchOnReconnect: get(opts.refetchOnReconnect),
      throwOnError: opts.throwOnError as never,
      suspense: get(opts.suspense) ?? false,
    });
  });

  const assignResult = (result: ReturnType<typeof observer.getCurrentResult>) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    state$.assign({
      data: result.data,
      error: result.error ?? null,
      status: result.status,
      fetchStatus: result.fetchStatus as "fetching" | "paused" | "idle",
      isPending: result.isPending,
      isSuccess: result.isSuccess,
      isError: result.isError,
      isLoadingError: result.isLoadingError,
      isRefetchError: result.isRefetchError,
      isFetching: result.isFetching,
      isPaused: result.isPaused,
      isRefetching: result.isRefetching,
      isLoading: result.isLoading,
      isInitialLoading: result.isLoading,
      isStale: result.isStale,
      isPlaceholderData: result.isPlaceholderData,
      isFetched: result.isFetched,
      isFetchedAfterMount: result.isFetchedAfterMount,
      isEnabled: result.isEnabled ?? true,
      dataUpdatedAt: result.dataUpdatedAt,
      errorUpdatedAt: result.errorUpdatedAt,
      failureCount: result.failureCount,
      failureReason: result.failureReason ?? null,
      errorUpdateCount: result.errorUpdateCount,
    } as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  assignResult(observer.getCurrentResult());
  const unsubscribe = observer.subscribe(assignResult);

  onUnmount(unsubscribe);

  return state$;
}
