import { useObservable } from "@legendapp/state/react";
import { useRafFn } from ".";

export default function UseRafFnDemo() {
  const count$ = useObservable(0);
  const delta$ = useObservable(0);

  const { isActive$, pause, resume } = useRafFn(({ delta }) => {
    delta$.set(delta);
    count$.set(count$.peek() + 1);
  });

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
          flexDirection: "column",
          gap: "4px",
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
        }}
      >
        <div>
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>Frames: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>{count$.get()}</span>
        </div>
        <div>
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>Delta: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>
            {delta$.get().toFixed(0)}ms
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={isActive$.get() ? pause : resume}
        style={{
          padding: "6px 16px",
          borderRadius: "6px",
          border: `1px solid ${isActive$.get() ? "var(--sl-color-orange, #f97316)" : "var(--sl-color-green, #22c55e)"}`,
          background: isActive$.get()
            ? "var(--sl-color-orange-low, #fff7ed)"
            : "var(--sl-color-green-low, #f0fdf4)",
          color: isActive$.get()
            ? "var(--sl-color-orange, #f97316)"
            : "var(--sl-color-green, #22c55e)",
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        {isActive$.get() ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
