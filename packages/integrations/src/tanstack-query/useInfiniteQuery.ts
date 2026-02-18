"use client"
import { useObservable, useObserve } from "@legendapp/state/react";
import { batch, isObservable } from "@legendapp/state";
import {
  QueryKey,
  InfiniteQueryObserver,
  InfiniteData,
  QueryFunctionContext,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Observable } from "@legendapp/state";
import { useQueryClient } from "./useQueryClient";

/**
 * QueryKey를 직렬화하면서 Observable 값을 추출합니다.
 */
function serializeQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_key, value) => {
    if (isObservable(value)) {
      return value.get();
    }
    return value;
  });
}

export interface UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> {
  queryKey: TQueryKey;
  queryFn: (
    context: QueryFunctionContext<TQueryKey, TPageParam>,
  ) => Promise<TQueryFnData>;

  // REQUIRED in v5
  initialPageParam: TPageParam;
  getNextPageParam: (
    lastPage: TQueryFnData,
    allPages: Array<TQueryFnData>,
    lastPageParam: TPageParam,
    allPageParams: Array<TPageParam>,
  ) => TPageParam | undefined | null;

  // Optional
  getPreviousPageParam?: (
    firstPage: TQueryFnData,
    allPages: Array<TQueryFnData>,
    firstPageParam: TPageParam,
    allPageParams: Array<TPageParam>,
  ) => TPageParam | undefined | null;

  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
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
}

/**
 * TanStack Query Infinite Query와 Legend-App-State를 연결하는 커스텀 훅
 *
 * @example
 * ```tsx
 * // Cursor-based pagination
 * const items$ = useInfiniteQuery({
 *   queryKey: ['items'],
 *   queryFn: ({ pageParam }) =>
 *     fetch(\`/api/items?cursor=\${pageParam}\`).then(r => r.json()),
 *   initialPageParam: undefined,
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * })
 *
 * // Observable reactivity
 * const filter$ = useObservable({ category: 'electronics' })
 * const items$ = useInfiniteQuery({
 *   queryKey: ['items', filter$],
 *   queryFn: ({ pageParam }) =>
 *     fetch(\`/api/items?category=\${filter$.category.get()}&cursor=\${pageParam}\`)
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
  options: UseInfiniteQueryOptions<TQueryFnData, TQueryKey, TPageParam>,
): Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> & {
  refetch: () => void;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
} {
  const queryClient = useQueryClient();

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
    isEnabled: options.enabled ?? true,
    isInitialLoading: true,
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
  });

  const observerRef = useRef<InfiniteQueryObserver<
    TQueryFnData,
    Error,
    InfiniteData<TQueryFnData>,
    TQueryKey,
    TPageParam
  > | null>(null);
  const previousQueryKeyRef = useRef<string | null>(null);

  if (!observerRef.current) {
    const initialQueryKeyString = serializeQueryKey(options.queryKey);
    previousQueryKeyRef.current = initialQueryKeyString;

    observerRef.current = new InfiniteQueryObserver<
      TQueryFnData,
      Error,
      InfiniteData<TQueryFnData>,
      TQueryKey,
      TPageParam
    >(queryClient, {
      queryKey: [initialQueryKeyString] as unknown as TQueryKey,
      queryFn: options.queryFn,
      enabled: options.enabled ?? true,
      staleTime: options.staleTime,
      gcTime: options.gcTime,
      retry: options.retry,
      refetchOnWindowFocus: options.refetchOnWindowFocus,
      refetchOnMount: options.refetchOnMount,
      refetchOnReconnect: options.refetchOnReconnect,
      initialPageParam: options.initialPageParam,
      getNextPageParam: options.getNextPageParam,
      getPreviousPageParam: options.getPreviousPageParam,
      maxPages: options.maxPages,
    });
  }

  useObserve(() => {
    const queryKeyString = serializeQueryKey(options.queryKey);
    const hasQueryKeyChanged = previousQueryKeyRef.current !== queryKeyString;

    observerRef.current?.setOptions({
      queryKey: [queryKeyString] as unknown as TQueryKey,
      queryFn: options.queryFn,
      enabled: options.enabled ?? true,
      staleTime: options.staleTime,
      gcTime: options.gcTime,
      retry: options.retry,
      refetchOnWindowFocus: options.refetchOnWindowFocus,
      refetchOnMount: options.refetchOnMount,
      refetchOnReconnect: options.refetchOnReconnect,
      initialPageParam: options.initialPageParam,
      getNextPageParam: options.getNextPageParam,
      getPreviousPageParam: options.getPreviousPageParam,
      maxPages: options.maxPages,
    });

    if (hasQueryKeyChanged && previousQueryKeyRef.current !== null) {
      observerRef.current?.refetch();
    }

    previousQueryKeyRef.current = queryKeyString;
  });

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    const unsubscribe = observer.subscribe((result: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = state$ as any
      batch(() => {
        s.data.set(result.data)
        s.error.set(result.error)
        s.status.set(result.status)
        s.fetchStatus.set(result.fetchStatus)
        s.isPending.set(result.isPending)
        s.isSuccess.set(result.isSuccess)
        s.isError.set(result.isError)
        s.isLoadingError.set(result.isLoadingError)
        s.isRefetchError.set(result.isRefetchError)
        s.isFetching.set(result.isFetching)
        s.isPaused.set(result.isPaused)
        s.isRefetching.set(result.isRefetching)
        s.isLoading.set(result.isLoading)
        s.isInitialLoading.set(result.isLoading)
        s.isStale.set(result.isStale)
        s.isPlaceholderData.set(result.isPlaceholderData)
        s.isFetched.set(result.isFetched)
        s.isFetchedAfterMount.set(result.isFetchedAfterMount)
        s.isEnabled.set(result.isEnabled ?? true)
        s.dataUpdatedAt.set(result.dataUpdatedAt)
        s.errorUpdatedAt.set(result.errorUpdatedAt)
        s.failureCount.set(result.failureCount)
        s.failureReason.set(result.failureReason)
        s.errorUpdateCount.set(result.errorUpdateCount)
        s.hasNextPage.set(result.hasNextPage ?? false)
        s.hasPreviousPage.set(result.hasPreviousPage ?? false)
        s.isFetchingNextPage.set(result.isFetchingNextPage ?? false)
        s.isFetchingPreviousPage.set(result.isFetchingPreviousPage ?? false)
        s.isFetchNextPageError.set(result.isFetchNextPageError ?? false)
        s.isFetchPreviousPageError.set(result.isFetchPreviousPageError ?? false)
      });
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = () => {
    observerRef.current?.refetch();
  };

  const fetchNextPage = () => {
    observerRef.current?.fetchNextPage();
  };

  const fetchPreviousPage = () => {
    observerRef.current?.fetchPreviousPage();
  };

  return {
    ...state$,
    refetch,
    fetchNextPage,
    fetchPreviousPage,
  } as Observable<InfiniteQueryState<InfiniteData<TQueryFnData>>> & {
    refetch: () => void;
    fetchNextPage: () => void;
    fetchPreviousPage: () => void;
  };
}
