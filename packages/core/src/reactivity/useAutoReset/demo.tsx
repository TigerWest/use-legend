import { useAutoReset } from ".";

export default function UseAutoResetDemo() {
  const message$ = useAutoReset("", 2000);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => message$.set("Saved!")}
          style={{
            padding: "8px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => message$.set("Error!")}
          style={{
            padding: "8px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Error
        </button>
        <button
          type="button"
          onClick={() => message$.set("")}
          style={{
            padding: "8px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Clear
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
        {message$.get() || "(empty — resets after 2s)"}
      </div>
    </div>
  );
}
