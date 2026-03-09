import { observable, observe, type Observable } from "@legendapp/state";
import {
  QueryClient,
  QueryKey,
  InfiniteQueryObserver,
  InfiniteData,
  QueryFunctionContext,
} from "@tanstack/query-core";
import { get, peek, type MaybeObservable, type Disposable } from "@usels/core";
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
 * Framework-agnostic — no React imports.
 *
 * Creates an InfiniteQueryObserver and subscribes immediately. Reacts to option
 * changes (including Observable elements in queryKey) via `observe()`.
 *
 * @param queryClient - The TanStack QueryClient instance.
 * @param options$ - Observable containing infinite query options.
 * @returns Disposable with `state$` Observable reflecting infinite query state,
 *   including fetchNextPage and fetchPreviousPage controls.
 */
export function createInfiniteQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  queryClient: QueryClient,
  options$: Observable<CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>>
): Disposable & {
  state$: Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>>;
  observer: InfiniteQueryObserver<
    TQueryFnData,
    Error,
    InfiniteData<TQueryFnData>,
    TQueryKey,
    TPageParam
  >;
} {
  type InfiniteOpts = CreateInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;
  const subscriptions: (() => void)[] = [];

  // Non-reactive snapshot for initial observer creation
  const initialOpts = options$.peek() as InfiniteOpts | undefined;
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

  // React to option changes (including Observable elements inside queryKey).
  subscriptions.push(
    observe(() => {
      const opts = options$.get() as InfiniteOpts | undefined;
      if (!opts) return;

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
    })
  );

  // Subscribe immediately — updates state$ on every result change.
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
  subscriptions.push(observer.subscribe(assignResult));

  return {
    state$,
    observer,
    dispose: () => subscriptions.forEach((unsub) => unsub()),
  };
}
