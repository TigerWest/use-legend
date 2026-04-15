import { For, Show, useObservable } from "@usels/core";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@usels/tanstack-query";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatusBadge,
  StatCard,
  demoClasses,
} from "@demos/_shared";

interface Page {
  items: { id: number; name: string }[];
  nextCursor: number | null;
}

const ITEMS_PER_PAGE = 5;
const TOTAL_PAGES = 4;

function fetchItems(cursor: number): Promise<Page> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const items = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => ({
        id: cursor * ITEMS_PER_PAGE + i + 1,
        name: `Item ${cursor * ITEMS_PER_PAGE + i + 1}`,
      }));
      resolve({
        items,
        nextCursor: cursor + 1 < TOTAL_PAGES ? cursor + 1 : null,
      });
    }, 600);
  });
}

const queryClient = new QueryClient();

function InfiniteQueryDemo() {
  const query$ = useInfiniteQuery<Page, readonly unknown[], number>({
    queryKey: ["demo-items"],
    queryFn: ({ pageParam }: { pageParam: number }) => fetchItems(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page) => lastPage.nextCursor,
  });

  const pageCount$ = useObservable(() => query$.data.get()?.pages.length ?? 0);
  const totalItems$ = useObservable(() =>
    (query$.data.get()?.pages ?? []).reduce((sum, page) => sum + page.items.length, 0)
  );
  const allItems$ = useObservable(() =>
    (query$.data.get()?.pages ?? []).flatMap((page) => page.items)
  );

  const statusTone$ = useObservable(() =>
    query$.isSuccess.get()
      ? ("green" as const)
      : query$.isError.get()
        ? ("orange" as const)
        : ("accent" as const)
  );
  const statusLabel$ = useObservable(() =>
    query$.isLoading.get() ? "Loading" : query$.isSuccess.get() ? "Success" : "Error"
  );

  return (
    <DemoPanel
      title="useInfiniteQuery"
      description="Paginated list — load more pages with a button."
      aside={<StatusBadge label={statusLabel$.get()} tone={statusTone$.get()} />}
    >
      <div className={demoClasses.statsGrid}>
        <StatCard label="Pages" value={pageCount$.get()} />
        <StatCard label="Items" value={totalItems$.get()} />
        <StatCard
          label="Has More"
          value={query$.hasNextPage.get() ? "Yes" : "No"}
          tone={query$.hasNextPage.get() ? "accent" : "neutral"}
        />
      </div>

      <div className={demoClasses.valueRow} style={{ justifyContent: "left" }}>
        <Show
          if={query$.isLoading}
          else={<For each={allItems$}>{(item$) => <span>{item$.name.get()}</span>}</For>}
        >
          <span>Loading first page...</span>
        </Show>
      </div>

      <div className={demoClasses.actionRow}>
        <ActionButton
          onClick={() => query$.fetchNextPage()}
          tone="accent"
          grow
          disabled={!query$.hasNextPage.get() || query$.isFetchingNextPage.get()}
        >
          <Show
            if={query$.isFetchingNextPage}
            else={
              <Show if={query$.hasNextPage} else="All loaded">
                Load More
              </Show>
            }
          >
            Loading more...
          </Show>
        </ActionButton>
      </div>
    </DemoPanel>
  );
}

export default function UseInfiniteQueryDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoShell eyebrow="TanStack Query">
        <InfiniteQueryDemo />
      </DemoShell>
    </QueryClientProvider>
  );
}
