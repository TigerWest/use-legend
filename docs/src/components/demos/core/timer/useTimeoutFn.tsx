import { useObservable } from "@legendapp/state/react";
import { useTimeoutFn } from "@usels/core";

const defaultText = "Please wait for 3 seconds";

export default function UseTimeoutFnDemo() {
  const text$ = useObservable(defaultText);

  const { start, isPending$ } = useTimeoutFn(() => {
    text$.set("Fired!");
  }, 3000);

  const restart = () => {
    text$.set(defaultText);
    start();
  };

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
        <span
          style={{
            color:
              text$.get() === "Fired!"
                ? "var(--sl-color-green, #22c55e)"
                : "var(--sl-color-white, #1e293b)",
            fontWeight: text$.get() === "Fired!" ? "bold" : "normal",
          }}
        >
          {text$.get()}
        </span>
      </div>
      <button
        type="button"
        disabled={isPending$.get()}
        onClick={restart}
        style={{
          padding: "6px 16px",
          borderRadius: "6px",
          border: `1px solid ${isPending$.get() ? "var(--sl-color-gray-5, #e2e8f0)" : "var(--sl-color-green, #22c55e)"}`,
          background: isPending$.get()
            ? "var(--sl-color-gray-6, #f1f5f9)"
            : "var(--sl-color-green-low, #f0fdf4)",
          color: isPending$.get()
            ? "var(--sl-color-gray-3, #94a3b8)"
            : "var(--sl-color-green, #22c55e)",
          cursor: isPending$.get() ? "not-allowed" : "pointer",
          fontFamily: "monospace",
        }}
      >
        Restart
      </button>
    </div>
  );
}
