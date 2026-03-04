import { useManualReset } from ".";

export default function UseManualResetDemo() {
  const { value$, reset } = useManualReset("hello");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={value$.get()}
          onChange={(e) => value$.set(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            flex: 1,
          }}
        />
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "8px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "6px",
          minHeight: "40px",
          border: "1px solid #eee",
        }}
      >
        Current: {value$.get() || "(empty)"}
      </div>
    </div>
  );
}
