import { Show } from "@legendapp/state/react";
import { useCountdown } from ".";

export default function UseCountdownDemo() {
  const { remaining$, isActive$, pause, resume, reset, stop, start } = useCountdown(60);

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
          padding: "16px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          textAlign: "center",
        }}
      >
        <strong style={{ fontSize: "32px", color: "var(--sl-color-white, #1e293b)" }}>
          {remaining$.get()}
        </strong>
        <div
          style={{ marginTop: "4px", fontSize: "12px", color: "var(--sl-color-gray-3, #94a3b8)" }}
        >
          {isActive$.get() ? "running" : "paused"}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <Show
          if={isActive$}
          else={
            <button
              type="button"
              onClick={resume}
              style={{
                flex: 1,
                margin: 0,
                padding: "6px 16px",
                borderRadius: "6px",
                border: "1px solid var(--sl-color-green, #22c55e)",
                background: "var(--sl-color-green-low, #f0fdf4)",
                color: "var(--sl-color-green, #22c55e)",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              Resume
            </button>
          }
        >
          <button
            type="button"
            onClick={pause}
            style={{
              flex: 1,
              margin: 0,
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid var(--sl-color-orange, #f97316)",
              background: "var(--sl-color-orange-low, #fff7ed)",
              color: "var(--sl-color-orange, #f97316)",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            Pause
          </button>
        </Show>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            flex: 1,
            margin: 0,
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid var(--sl-color-gray-4, #cbd5e1)",
            background: "var(--sl-color-gray-6, #f1f5f9)",
            color: "var(--sl-color-white, #1e293b)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={stop}
          style={{
            flex: 1,
            margin: 0,
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid var(--sl-color-gray-4, #cbd5e1)",
            background: "var(--sl-color-gray-6, #f1f5f9)",
            color: "var(--sl-color-white, #1e293b)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Stop
        </button>
        <button
          type="button"
          onClick={() => start()}
          style={{
            flex: 1,
            margin: 0,
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid var(--sl-color-green, #22c55e)",
            background: "var(--sl-color-green-low, #f0fdf4)",
            color: "var(--sl-color-green, #22c55e)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}
