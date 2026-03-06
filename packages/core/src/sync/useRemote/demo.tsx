import { Show } from "@legendapp/state/react";
import { useRemote } from ".";

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
        <span style={label}>status</span>
        <span style={value}>
          {isFetching$.get() ? "fetching..." : isLoaded$.get() ? "loaded" : "loading..."}
        </span>
      </div>
      <Show if={error$}>
        <div style={{ ...row, borderColor: "#ef4444" }}>
          <span style={label}>error</span>
          <span style={{ ...value, color: "#ef4444" }}>{error$.get()?.message}</span>
        </div>
      </Show>
      <div style={row}>
        <span style={label}>value</span>
        <span style={value}>{data$.value.get()}</span>
      </div>
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
          alignSelf: "flex-start",
        }}
        onClick={refetch}
      >
        Refetch
      </button>
    </div>
  );
}
