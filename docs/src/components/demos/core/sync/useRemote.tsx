import { Show } from "@legendapp/state/react";
import { useRemote } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatCard,
  StatusBadge,
  demoClasses,
} from "@demos/_shared";

// Simple mock: resolves with a random number after 500ms
const mockFetch = () =>
  new Promise<{ value: number }>((resolve) =>
    setTimeout(() => resolve({ value: Math.floor(Math.random() * 100) }), 500)
  );

export default function UseRemoteDemo() {
  const { data$, isLoaded$, isFetching$, error$, refetch } = useRemote<{ value: number }>({
    get: mockFetch,
    initial: { value: 0 },
  });

  return (
    <DemoShell eyebrow="Sync">
      <DemoPanel
        title="useRemote"
        description="Fetches data from a remote source. No local persistence."
        aside={
          <StatusBadge
            label={isFetching$.get() ? "Fetching..." : isLoaded$.get() ? "Loaded" : "Loading..."}
            tone={isFetching$.get() ? "orange" : isLoaded$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="Value" value={data$.value.get()} tone="accent" />
          <Show if={error$}>
            <StatCard label="Error" value={error$.get()?.message} tone="orange" />
          </Show>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={refetch} tone="accent" grow>
            Refetch
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
