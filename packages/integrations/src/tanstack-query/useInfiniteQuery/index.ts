"use client";
import { useMount, useObservable, useObserve } from "@legendapp/state/react";
import {
  QueryKey,
  InfiniteQueryObserver,
  InfiniteData,
  QueryFunctionContext,
} from "@tanstack/query-core";
import { useRef } from "react";
import type { Observable } from "@legendapp/state";
import {
  get,
  peek,
  type MaybeObservable,
  type DeepMaybeObservable,
  useMaybeObservable,
} from "@usels/core";
import { useQueryClient } from "../useQueryClient";
import { resolveQueryKey } from "../keyResolvers";

export interface UseInfiniteQueryOptions<
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
 * TanStack Query Infinite Query와 Legend-App-State를 연결하는 커스텀 훅
 * InfiniteQueryObserver를 사용하여 쿼리 상태를 observable로 관리합니다.
 *
 * Observable 값을 파라미터로 받을 수 있으며, 변경 시 자동으로 refetch됩니다.
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
  options: DeepMaybeObservable<UseInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>>
): Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> {
  type InfiniteOpts = UseInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>;
  const queryClient = useQueryClient();
  const observerRef = useRef<InfiniteQueryObserver<
    TQueryFnData,
    Error,
    InfiniteData<TQueryFnData>,
    TQueryKey,
    TPageParam
  > | null>(null);

  const opts$ = useMaybeObservable<InfiniteOpts>(options as DeepMaybeObservable<InfiniteOpts>, {
    queryFn: "function",
    getNextPageParam: "function",
    getPreviousPageParam: "function",
  });
  const initialOptions = opts$.peek() as InfiniteOpts | undefined;

  // Observable 상태 초기화 (refetch/fetchNextPage/fetchPreviousPage는 별도 함수로 분리 - observable 안에 넣으면 Observable<Function>이 됨)
  const state$ = useObservable({
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
    isEnabled: peek(initialOptions?.enabled) ?? true,
    isInitialLoading: true,
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    refetch() {
      observerRef.current?.refetch();
    },
    fetchNextPage() {
      observerRef.current?.fetchNextPage();
    },
    fetchPreviousPage() {
      observerRef.current?.fetchPreviousPage();
    },
  });

  if (observerRef.current === null) {
    const initialQueryKey = resolveQueryKey(initialOptions?.queryKey ?? []);
    observerRef.current = new InfiniteQueryObserver<
      TQueryFnData,
      Error,
      InfiniteData<TQueryFnData>,
      TQueryKey,
      TPageParam
    >(queryClient, {
      queryKey: initialQueryKey as TQueryKey,
      queryFn: initialOptions?.queryFn ?? (() => Promise.resolve(undefined as TQueryFnData)),
      enabled: peek(initialOptions?.enabled) ?? true,
      staleTime: peek(initialOptions?.staleTime),
      gcTime: peek(initialOptions?.gcTime),
      retry: peek(initialOptions?.retry),
      refetchOnWindowFocus: peek(initialOptions?.refetchOnWindowFocus),
      refetchOnMount: peek(initialOptions?.refetchOnMount),
      refetchOnReconnect: peek(initialOptions?.refetchOnReconnect),
      throwOnError: initialOptions?.throwOnError as never,
      suspense: peek(initialOptions?.suspense) ?? false,
      initialPageParam: initialOptions?.initialPageParam as TPageParam,
      getNextPageParam:
        initialOptions?.getNextPageParam ?? (() => undefined as TPageParam | undefined | null),
      getPreviousPageParam: initialOptions?.getPreviousPageParam,
      maxPages: initialOptions?.maxPages,
    });
  }

  useObserve(() => {
    const resolved = opts$.get() as InfiniteOpts | undefined;
    if (!resolved) return;
    const resolvedKey = resolveQueryKey(resolved.queryKey ?? []);

    observerRef.current?.setOptions({
      queryKey: resolvedKey as TQueryKey,
      queryFn: resolved.queryFn,
      enabled: get(resolved.enabled) ?? true,
      staleTime: get(resolved.staleTime),
      gcTime: get(resolved.gcTime),
      retry: get(resolved.retry),
      refetchOnWindowFocus: get(resolved.refetchOnWindowFocus),
      refetchOnMount: get(resolved.refetchOnMount),
      refetchOnReconnect: get(resolved.refetchOnReconnect),
      throwOnError: resolved.throwOnError as never,
      suspense: get(resolved.suspense) ?? false,
      initialPageParam: resolved.initialPageParam,
      getNextPageParam: resolved.getNextPageParam,
      getPreviousPageParam: resolved.getPreviousPageParam,
      maxPages: resolved.maxPages,
    });
  });

  // 구독은 한 번만 설정 (React lifecycle)
  useMount(() => {
    const observer = observerRef.current;
    if (!observer) return;

    const assignResult = (result: ReturnType<typeof observer.getCurrentResult>) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    };
    assignResult(observer.getCurrentResult());
    const unsubscribe = observer.subscribe(assignResult);

    return () => {
      unsubscribe();
    };
    // state$는 stable하므로 의존성에 불필요
  });

  const renderOpts = opts$.peek() as InfiniteOpts | undefined;
  /* eslint-disable react-hooks/refs -- suspense requires render-time observer snapshot access */
  const observer = observerRef.current;
  if (observer) {
    const result = observer.getCurrentResult();
    const suspense = get(renderOpts?.suspense) ?? false;

    if (suspense && result.isPending) {
      throw observer
        .fetchOptimistic(observer.options)
        .then((optimisticResult) => optimisticResult.data);
    }
  }
  /* eslint-enable react-hooks/refs */

  return state$;
}
