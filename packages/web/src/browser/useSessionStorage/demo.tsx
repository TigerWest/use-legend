import { useSessionStorage } from ".";

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

const btn: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: "6px",
  border: "1px solid var(--sl-color-accent, #6366f1)",
  background: "transparent",
  color: "var(--sl-color-accent, #6366f1)",
  cursor: "pointer",
  fontFamily: "monospace",
};

export default function UseSessionStorageDemo() {
  const step$ = useSessionStorage("demo-step", 1);

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
        <span style={label}>wizard step</span>
        <span style={value}>{step$.get()} / 5</span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" style={btn} onClick={() => step$.set(Math.max(1, step$.get() - 1))}>
          Back
        </button>
        <button type="button" style={btn} onClick={() => step$.set(Math.min(5, step$.get() + 1))}>
          Next
        </button>
        <button
          type="button"
          style={{
            ...btn,
            borderColor: "var(--sl-color-red, #ef4444)",
            color: "var(--sl-color-red, #ef4444)",
          }}
          onClick={() => step$.set(1)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
