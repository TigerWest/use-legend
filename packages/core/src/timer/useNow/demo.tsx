import { useNow } from ".";

export default function UseNowDemo() {
  const now$ = useNow();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
        }}
      >
        <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>Now: </span>
        <span style={{ color: "var(--sl-color-white, #1e293b)" }}>
          {now$.get().toLocaleString()}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        Updates every frame via requestAnimationFrame.
      </p>
    </div>
  );
}
