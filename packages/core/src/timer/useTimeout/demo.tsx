import { useTimeout } from ".";

export default function UseTimeoutDemo() {
  const { ready$, start } = useTimeout(1000, { controls: true });

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
        <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>Ready: </span>
        <strong
          style={{
            color: ready$.get()
              ? "var(--sl-color-green, #22c55e)"
              : "var(--sl-color-orange, #f97316)",
          }}
        >
          {ready$.get().toString()}
        </strong>
      </div>
      <button
        type="button"
        disabled={!ready$.get()}
        onClick={() => start()}
        style={{
          padding: "6px 16px",
          borderRadius: "6px",
          border: `1px solid ${ready$.get() ? "var(--sl-color-green, #22c55e)" : "var(--sl-color-gray-5, #e2e8f0)"}`,
          background: ready$.get()
            ? "var(--sl-color-green-low, #f0fdf4)"
            : "var(--sl-color-gray-6, #f1f5f9)",
          color: ready$.get()
            ? "var(--sl-color-green, #22c55e)"
            : "var(--sl-color-gray-3, #94a3b8)",
          cursor: ready$.get() ? "pointer" : "not-allowed",
          fontFamily: "monospace",
        }}
      >
        Start Again
      </button>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        Ready becomes true after 1 second.
      </p>
    </div>
  );
}
