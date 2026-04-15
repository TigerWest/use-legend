import { For, observable, Show, useObservable } from "@usels/core";
import { QueryClient, QueryClientProvider, useQuery } from "@usels/tanstack-query";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "@demos/_shared";

const MOCK_DATA: Record<string, { id: number; name: string }[]> = {
  electronics: [
    { id: 1, name: "Keyboard" },
    { id: 2, name: "Mouse" },
    { id: 3, name: "Monitor" },
  ],
  clothing: [
    { id: 4, name: "T-Shirt" },
    { id: 5, name: "Jacket" },
    { id: 6, name: "Sneakers" },
  ],
  books: [
    { id: 7, name: "TypeScript Handbook" },
    { id: 8, name: "React in Action" },
    { id: 9, name: "Clean Code" },
  ],
};

const category$ = observable("electronics");
const queryClient = new QueryClient();

function fetchProducts(category: string) {
  return new Promise<{ id: number; name: string }[]>((resolve) => {
    setTimeout(() => resolve(MOCK_DATA[category] ?? []), 800);
  });
}

function QueryDemo() {
  const query = useQuery({
    queryKey: ["products", category$],
    queryFn: () => fetchProducts(category$.peek()),
  });

  const products$ = useObservable(() => query.data.get() ?? []);
  const statusTone$ = useObservable(() =>
    query.isSuccess.get()
      ? ("green" as const)
      : query.isError.get()
        ? ("orange" as const)
        : ("accent" as const)
  );
  const statusLabel$ = useObservable(() =>
    query.isLoading.get()
      ? "Loading"
      : query.isSuccess.get()
        ? "Success"
        : query.isError.get()
          ? "Error"
          : "Idle"
  );

  return (
    <DemoPanel
      title="useQuery"
      description="Select a category — the query auto-refetches via Observable queryKey."
      aside={<StatusBadge label={statusLabel$.get()} tone={statusTone$.get()} />}
    >
      <div className={demoClasses.actionRow}>
        {["electronics", "clothing", "books"].map((cat) => (
          <ActionButton
            key={cat}
            onClick={() => category$.set(cat)}
            tone={category$.get() === cat ? "accent" : "neutral"}
          >
            {cat}
          </ActionButton>
        ))}
      </div>

      <div className={demoClasses.valueRow}>
        <Show
          if={query.isFetching}
          else={<For each={products$}>{(item$) => <span>{item$.name.get()}</span>}</For>}
        >
          <span>Fetching...</span>
        </Show>
      </div>

      <div className={demoClasses.actionRow}>
        <ActionButton onClick={() => query.refetch()} tone="neutral" grow>
          Refetch
        </ActionButton>
      </div>
    </DemoPanel>
  );
}

export default function UseQueryDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoShell eyebrow="TanStack Query">
        <QueryDemo />
      </DemoShell>
    </QueryClientProvider>
  );
}
