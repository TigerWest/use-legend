import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/query-core";
import { dehydrate, HydrationBoundary } from "../HydrationBoundary";
import { QueryClientProvider } from "../QueryClientProvider";
import { useQuery } from "../useQuery";

describe("HydrationBoundary", () => {
  it("should hydrate prefetched query data", async () => {
    const serverClient = new QueryClient();
    serverClient.setQueryData(["users", "1"], { id: 1, name: "Ada" });
    const dehydratedState = dehydrate(serverClient);

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    const queryFn = vi.fn().mockResolvedValue({ id: 1, name: "Fetched" });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["users", "1"],
          queryFn,
          staleTime: Infinity,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess.get()).toBe(true));
    expect(result.current.data.get()).toEqual({ id: 1, name: "Ada" });
    expect(queryFn).not.toHaveBeenCalled();
  });
});
