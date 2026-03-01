import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { createWrapper } from "../../__tests__/test-utils";

describe("useInfiniteQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Infinite Query Functionality", () => {
    it("should initialize with pending state", () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: 1 });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      expect(result.current.isPending.get()).toBe(true);
      expect(result.current.isLoading.get()).toBe(true);
      expect(result.current.status.get()).toBe("pending");
      expect(result.current.data.get()).toBeUndefined();
    });

    it("should fetch first page successfully", async () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1", "item2"], nextCursor: 1 });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      const data = result.current.data.get();
      expect(data?.pages).toHaveLength(1);
      expect(data?.pages[0]).toEqual({ items: ["item1", "item2"], nextCursor: 1 });
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it("should expose data through observable", async () => {
      const testData = { items: ["item1"], nextCursor: 1 };
      const queryFn = vi.fn().mockResolvedValue(testData);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      const data = result.current.data.get();
      expect(data?.pages[0]).toEqual(testData);
    });

    it("should have InfiniteData structure", async () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: 1 });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      const data = result.current.data.get();
      expect(data).toHaveProperty("pages");
      expect(data).toHaveProperty("pageParams");
      expect(Array.isArray(data?.pages)).toBe(true);
      expect(Array.isArray(data?.pageParams)).toBe(true);
    });
  });

  describe("Pagination", () => {
    it("should fetch next page when fetchNextPage is called", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 0 }) => {
        return Promise.resolve({
          items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
          nextCursor: pageParam < 2 ? pageParam + 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));
      expect(result.current.data.get()?.pages).toHaveLength(1);

      // Fetch next page
      result.current.fetchNextPage();

      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));
      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(result.current.data.get()?.pages[1]).toEqual({
        items: ["item-1-1", "item-1-2"],
        nextCursor: 2,
      });
    });

    it("should set hasNextPage based on getNextPageParam", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 0 }) => {
        return Promise.resolve({
          items: [`item-${pageParam}`],
          nextCursor: pageParam < 1 ? pageParam + 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // First page - should have next page
      expect(result.current.hasNextPage.get()).toBe(true);

      // Fetch next page
      result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));

      // Second page - no more pages (nextCursor is undefined)
      expect(result.current.hasNextPage.get()).toBe(false);
    });

    it("should set isFetchingNextPage during next page fetch", async () => {
      let resolveQuery: (value: any) => void;
      const queryFn = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveQuery = resolve;
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: () => 1,
          }),
        { wrapper }
      );

      // Wait for initial fetch
      resolveQuery!({ items: ["item1"], nextCursor: 1 });
      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Start fetching next page
      result.current.fetchNextPage();

      // Should be fetching next page
      await waitFor(() => expect(result.current.isFetchingNextPage.get()).toBe(true));

      // Resolve the next page
      resolveQuery!({ items: ["item2"], nextCursor: 2 });

      // Should stop fetching
      await waitFor(() => expect(result.current.isFetchingNextPage.get()).toBe(false));
    });

    it("should fetch previous page when fetchPreviousPage is called", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 1 }) => {
        return Promise.resolve({
          items: [`item-${pageParam}`],
          nextCursor: pageParam < 2 ? pageParam + 1 : undefined,
          prevCursor: pageParam > 0 ? pageParam - 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 1,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
            getPreviousPageParam: (firstPage: any) => firstPage.prevCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));
      expect(result.current.data.get()?.pages).toHaveLength(1);

      // Fetch previous page
      result.current.fetchPreviousPage();

      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));
      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it("should set hasPreviousPage based on getPreviousPageParam", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 1 }) => {
        return Promise.resolve({
          items: [`item-${pageParam}`],
          prevCursor: pageParam > 0 ? pageParam - 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 1,
            getNextPageParam: () => undefined,
            getPreviousPageParam: (firstPage: any) => firstPage.prevCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Should have previous page
      expect(result.current.hasPreviousPage.get()).toBe(true);

      // Fetch previous page
      result.current.fetchPreviousPage();
      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));

      // At page 0 - no more previous pages
      expect(result.current.hasPreviousPage.get()).toBe(false);
    });

    it("should track multiple pages in data.pages array", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 0 }) => {
        return Promise.resolve({
          items: [`page-${pageParam}`],
          nextCursor: pageParam < 2 ? pageParam + 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));
      expect(result.current.data.get()?.pages).toHaveLength(1);

      // Fetch second page
      result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));

      // Fetch third page
      result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(3));

      expect(queryFn).toHaveBeenCalledTimes(3);
    });

    it("should track page parameters in data.pageParams array", async () => {
      const queryFn = vi.fn().mockImplementation(({ pageParam = 0 }) => {
        return Promise.resolve({
          items: [`page-${pageParam}`],
          nextCursor: pageParam + 1,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      const data = result.current.data.get();
      expect(data?.pageParams).toEqual([0]);

      // Fetch next page
      result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data.get()?.pages).toHaveLength(2));

      const updatedData = result.current.data.get();
      expect(updatedData?.pageParams).toEqual([0, 1]);
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch next page errors", async () => {
      let shouldFail = false;
      const error = new Error("Failed to fetch next page");
      const queryFn = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(error);
        }
        return Promise.resolve({ items: ["item1"], nextCursor: 1 });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
            retry: false,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Make next page fail
      shouldFail = true;
      result.current.fetchNextPage();

      await waitFor(() => expect(result.current.isFetchNextPageError.get()).toBe(true), {
        timeout: 3000,
      });
    });

    it("should handle fetch previous page errors", async () => {
      let shouldFail = false;
      const error = new Error("Failed to fetch previous page");
      const queryFn = vi.fn().mockImplementation(({ pageParam = 1 }) => {
        if (shouldFail && pageParam === 0) {
          return Promise.reject(error);
        }
        return Promise.resolve({
          items: [`item-${pageParam}`],
          prevCursor: pageParam > 0 ? pageParam - 1 : undefined,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items"],
            queryFn,
            initialPageParam: 1,
            getNextPageParam: () => undefined,
            getPreviousPageParam: (firstPage: any) => firstPage.prevCursor,
            retry: false,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Make previous page fail
      shouldFail = true;
      result.current.fetchPreviousPage();

      await waitFor(() => expect(result.current.isFetchPreviousPageError.get()).toBe(true), {
        timeout: 3000,
      });
    });
  });

  describe("Observable Reactivity", () => {
    it("should refetch when observable in queryKey changes", async () => {
      const filter$ = observable({ category: "electronics" });
      let callCount = 0;
      const queryFn = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          items: [filter$.category.get()],
          nextCursor: undefined,
          call: callCount,
        });
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["products", filter$],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));
      expect(queryFn).toHaveBeenCalledTimes(1);

      // Change the observable - should trigger refetch
      filter$.category.set("sports");

      await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2), { timeout: 3000 });
      expect(result.current.data.get()?.pages[0].items).toEqual(["sports"]);
    });

    it("should use serialized queryKey for cache", async () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: undefined });
      const { wrapper, queryClient } = createWrapper();

      const filter$ = observable({ status: "active" });

      renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["items", filter$],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));

      // The actual cache key should be the serialized version
      const serializedKey = JSON.stringify(["items", { status: "active" }]);
      const cacheData = queryClient.getQueryData([serializedKey]);

      expect(cacheData).toBeTruthy();
    });
  });

  describe("State Completeness", () => {
    it("should include all 34 state fields", async () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: undefined });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Base fields
      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.status).toBeDefined();
      expect(result.current.fetchStatus).toBeDefined();
      expect(result.current.isPending).toBeDefined();
      expect(result.current.isSuccess).toBeDefined();
      expect(result.current.isError).toBeDefined();
      expect(result.current.isLoadingError).toBeDefined();
      expect(result.current.isRefetchError).toBeDefined();
      expect(result.current.isFetching).toBeDefined();
      expect(result.current.isPaused).toBeDefined();
      expect(result.current.isRefetching).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.isStale).toBeDefined();
      expect(result.current.isPlaceholderData).toBeDefined();
      expect(result.current.isFetched).toBeDefined();
      expect(result.current.isFetchedAfterMount).toBeDefined();
      expect(result.current.isEnabled).toBeDefined();
      expect(result.current.isInitialLoading).toBeDefined();
      expect(result.current.dataUpdatedAt).toBeDefined();
      expect(result.current.errorUpdatedAt).toBeDefined();
      expect(result.current.failureCount).toBeDefined();
      expect(result.current.failureReason).toBeDefined();
      expect(result.current.errorUpdateCount).toBeDefined();

      // Infinite-specific fields
      expect(result.current.hasNextPage).toBeDefined();
      expect(result.current.hasPreviousPage).toBeDefined();
      expect(result.current.isFetchingNextPage).toBeDefined();
      expect(result.current.isFetchingPreviousPage).toBeDefined();
      expect(result.current.isFetchNextPageError).toBeDefined();
      expect(result.current.isFetchPreviousPageError).toBeDefined();

      // Methods
      expect(typeof result.current.refetch).toBe("function");
      expect(typeof result.current.fetchNextPage).toBe("function");
      expect(typeof result.current.fetchPreviousPage).toBe("function");
    });

    it("should include infinite-query-specific fields", () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: 1 });
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      expect(result.current.hasNextPage.get()).toBe(false);
      expect(result.current.hasPreviousPage.get()).toBe(false);
      expect(result.current.isFetchingNextPage.get()).toBe(false);
      expect(result.current.isFetchingPreviousPage.get()).toBe(false);
      expect(result.current.isFetchNextPageError.get()).toBe(false);
      expect(result.current.isFetchPreviousPageError.get()).toBe(false);
    });
  });

  describe("Cleanup", () => {
    it("should unsubscribe on unmount", async () => {
      const queryFn = vi.fn().mockResolvedValue({ items: ["item1"], nextCursor: undefined });
      const { wrapper } = createWrapper();

      const { result, unmount } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["test"],
            queryFn,
            initialPageParam: 0,
            getNextPageParam: (lastPage: any) => lastPage.nextCursor,
          }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));

      // Unmount the hook
      unmount();

      // If there are no React warnings/errors, cleanup is working correctly
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });
});
