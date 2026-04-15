import {
  QueryKey,
  InfiniteQueryObserver,
  InfiniteData,
  QueryFunctionContext,
} from "@tanstack/query-core";
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

export interface CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> {
  queryKey: TQueryKey;
  queryFn: (context: QueryFunctionContext<TQueryKey, TPageParam>) => Promise<TQueryFnData>;

  // REQUIRED in v5
  initialPageParam: TPageParam;
  getNextPageParam: (
    lastPage: TQueryFnData,
    allPages: Array<TQueryFnData>,
    lastPageParam: TPageParam,
    allPageParams: Array<TPageParam>
  ) => TPageParam | undefined | null;

  // Optional
  getPreviousPageParam?: (
    firstPage: TQueryFnData,
    allPages: Array<TQueryFnData>,
    firstPageParam: TPageParam,
    allPageParams: Array<TPageParam>
  ) => TPageParam | undefined | null;

  enabled?: MaybeObservable<boolean>;
  staleTime?: MaybeObservable<number>;
  gcTime?: MaybeObservable<number>;
  retry?: MaybeObservable<number | boolean>;
  refetchOnWindowFocus?: MaybeObservable<boolean>;
  refetchOnMount?: MaybeObservable<boolean>;
  refetchOnReconnect?: MaybeObservable<boolean>;
  throwOnError?: boolean | ((error: Error) => boolean);
  suspense?: MaybeObservable<boolean>;
  maxPages?: number;
}

export interface InfiniteQueryState<TData = unknown> {
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
  isStale: boolean;
  isPlaceholderData: boolean;
  isFetched: boolean;
  isFetchedAfterMount: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
  failureReason: Error | null;
  errorUpdateCount: number;
  isEnabled: boolean;
  /**
   * @deprecated Use isLoading instead. Will be removed in TanStack Query v6.
   */
  isInitialLoading: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  isFetchNextPageError: boolean;
  isFetchPreviousPageError: boolean;

  refetch: () => void;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
}

/**
 * Core observable function for bridging TanStack Query infinite queries with Legend-State.
 *
 * Must be called inside a scope wrapped by a `QueryClientProvider` —
 * `getQueryClient()` injects the client from context.
 *
 * @param options - Plain object, per-field Observable, or outer Observable of options.
 * @returns Observable reflecting query state (incl. fetchNextPage/fetchPreviousPage/refetch).
 */
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options?: DeepMaybeObservable<CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>>
): Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> {
  type InfiniteOpts = CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;
  const queryClient = getQueryClient();
  const opts$ = observable(options) as Observable<InfiniteOpts>;

  const initialOpts = opts$.peek() as InfiniteOpts | undefined;
  const initialQueryKey = resolveQueryKey(initialOpts?.queryKey ?? []);

  const observer = new InfiniteQueryObserver<
    TQueryFnData,
    Error,
    InfiniteData<TQueryFnData>,
    TQueryKey,
    TPageParam
  >(queryClient, {
    queryKey: initialQueryKey as TQueryKey,
    queryFn: initialOpts?.queryFn ?? (() => Promise.resolve(undefined as TQueryFnData)),
    enabled: peek(initialOpts?.enabled) ?? true,
    staleTime: peek(initialOpts?.staleTime),
    gcTime: peek(initialOpts?.gcTime),
    retry: peek(initialOpts?.retry as MaybeObservable<number | boolean>),
    refetchOnWindowFocus: peek(initialOpts?.refetchOnWindowFocus),
    refetchOnMount: peek(initialOpts?.refetchOnMount),
    refetchOnReconnect: peek(initialOpts?.refetchOnReconnect),
    throwOnError: initialOpts?.throwOnError as never,
    suspense: peek(initialOpts?.suspense) ?? false,
    initialPageParam: initialOpts?.initialPageParam as TPageParam,
    getNextPageParam:
      initialOpts?.getNextPageParam ?? (() => undefined as TPageParam | undefined | null),
    getPreviousPageParam: initialOpts?.getPreviousPageParam,
    maxPages: initialOpts?.maxPages,
  });

  const state$ = observable<InfiniteQueryState<InfiniteData<TQueryFnData>>>({
    data: undefined as InfiniteData<TQueryFnData> | undefined,
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
    isStale: true,
    isPlaceholderData: false,
    isFetched: false,
    isFetchedAfterMount: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null as Error | null,
    errorUpdateCount: 0,
    isEnabled: peek(initialOpts?.enabled) ?? true,
    isInitialLoading: true,
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    refetch() {
      observer.refetch();
    },
    fetchNextPage() {
      observer.fetchNextPage();
    },
    fetchPreviousPage() {
      observer.fetchPreviousPage();
    },
  });

  const isMounted$ = createIsMounted();
  observe(() => {
    const opts = opts$.get() as InfiniteOpts | undefined;
    if (!opts || !isMounted$.get()) return;

    const resolvedKey = resolveQueryKey(opts.queryKey ?? []);

    observer.setOptions({
      queryKey: resolvedKey as TQueryKey,
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
      initialPageParam: opts.initialPageParam,
      getNextPageParam: opts.getNextPageParam,
      getPreviousPageParam: opts.getPreviousPageParam,
      maxPages: opts.maxPages,
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
      hasNextPage: result.hasNextPage ?? false,
      hasPreviousPage: result.hasPreviousPage ?? false,
      isFetchingNextPage: result.isFetchingNextPage ?? false,
      isFetchingPreviousPage: result.isFetchingPreviousPage ?? false,
      isFetchNextPageError: result.isFetchNextPageError ?? false,
      isFetchPreviousPageError: result.isFetchPreviousPageError ?? false,
    } as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  assignResult(observer.getCurrentResult());
  const unsubscribe = observer.subscribe(assignResult);

  onUnmount(unsubscribe);

  return state$;
}
