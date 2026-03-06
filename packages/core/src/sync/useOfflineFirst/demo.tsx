import { useOfflineFirst } from ".";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

const row: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 14px",
  borderRadius: "6px",
  border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
  background: "var(--sl-color-gray-6, #f8fafc)",
};

const label: React.CSSProperties = {
  color: "var(--sl-color-gray-3, #64748b)",
  fontSize: "12px",
};

const value: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  fontWeight: "bold",
  color: "var(--sl-color-text, #0f172a)",
};

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      <div style={row}>
        <span style={label}>persist</span>
        <span style={value}>{isPersistLoaded$.get() ? "ready" : "loading..."}</span>
      </div>
      <div style={row}>
        <span style={label}>remote</span>
        <span style={value}>
          {isFetching$.get() ? "fetching..." : isLoaded$.get() ? "synced" : "syncing..."}
        </span>
      </div>
      <div style={row}>
        <span style={label}>count</span>
        <span style={value}>{data$.count.get()}</span>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid var(--sl-color-accent, #6366f1)",
            background: "transparent",
            color: "var(--sl-color-accent, #6366f1)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
          onClick={() => data$.count.set((c) => c + 1)}
        >
          +1
        </button>
        <button
          type="button"
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
            background: "transparent",
            color: "var(--sl-color-gray-3, #64748b)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
          onClick={refetch}
        >
          Sync
        </button>
        <button
          type="button"
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid #ef4444",
            background: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
          onClick={clearPersist}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}
