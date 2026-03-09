import { useFps } from "@usels/core";

export default function UseFpsDemo() {
  const fps$ = useFps();

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
          display: "flex",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          gap: "10px",
        }}
      >
        <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>FPS:</span>
        <strong style={{ fontSize: "24px", color: "var(--sl-color-white, #1e293b)" }}>
          {fps$.get()}
        </strong>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        Sampled every 10 frames using requestAnimationFrame.
      </p>
    </div>
  );
}
