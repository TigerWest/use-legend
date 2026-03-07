import { useOfflineFirst } from ".";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../shared/_demo";

// Simulates a slow API with local state
let serverCount = 0;
const mockGet = () =>
  new Promise<{ count: number }>((resolve) =>
    setTimeout(() => resolve({ count: serverCount }), 800)
  );
const mockSet = ({ value: v }: { value: { count: number } }) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      serverCount = v.count;
      resolve();
    }, 300)
  );

export default function UseOfflineFirstDemo() {
  const { data$, isLoaded$, isFetching$, isPersistLoaded$, refetch, clearPersist } =
    useOfflineFirst<{ count: number }>({
      get: mockGet,
      set: mockSet,
      persistKey: "demo-offline-count",
      persistPlugin: ObservablePersistLocalStorage,
      initial: { count: 0 },
    });

  return (
    <DemoShell eyebrow="Sync">
      <DemoPanel
        title="useOfflineFirst"
        description="Local cache + remote sync with automatic retry."
        aside={
          <div className="flex gap-1.5">
            <StatusBadge
              label={isPersistLoaded$.get() ? "Cache Ready" : "Loading..."}
              tone={isPersistLoaded$.get() ? "green" : "neutral"}
            />
            <StatusBadge
              label={isFetching$.get() ? "Fetching..." : isLoaded$.get() ? "Synced" : "Syncing..."}
              tone={isFetching$.get() ? "orange" : isLoaded$.get() ? "green" : "neutral"}
            />
          </div>
        }
      >
        <div className={demoClasses.counterRow}>
          <ActionButton onClick={() => data$.count.set((c) => c - 1)} tone="neutral">
            -1
          </ActionButton>
          <div className={demoClasses.counterValue}>{data$.count.get()}</div>
          <ActionButton onClick={() => data$.count.set((c) => c + 1)} tone="accent">
            +1
          </ActionButton>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={refetch} tone="accent" grow>
            Sync
          </ActionButton>
          <ActionButton onClick={clearPersist} tone="orange" grow>
            Clear Cache
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
