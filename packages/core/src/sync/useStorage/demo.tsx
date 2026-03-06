import { useStorage } from ".";
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

export default function UseStorageDemo() {
  const { data$: count$ } = useStorage("demo-count", 0, {
    plugin: ObservablePersistLocalStorage,
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
        <span style={label}>count</span>
        <span style={value}>{count$.get()}</span>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
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
          onClick={() => count$.set(count$.get() + 1)}
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
          onClick={() => count$.set(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
