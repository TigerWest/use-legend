import { Show, useObservable } from "@legendapp/state/react";
import { useIntervalFn } from ".";

const greetings = ["Hello", "Hi", "Yo!", "Hey", "Hola", "Bonjour", "Salut!", "Ciao"];

export default function UseIntervalFnDemo() {
  const word$ = useObservable("Hello");

  const { isActive$, pause, resume } = useIntervalFn(() => {
    word$.set(greetings[Math.floor(Math.random() * greetings.length)]);
  }, 500);

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
          textAlign: "center",
        }}
      >
        <strong style={{ fontSize: "24px", color: "var(--sl-color-white, #1e293b)" }}>
          {word$.get()}
        </strong>
      </div>
      <Show
        if={() => isActive$.get()}
        else={
          <button
            type="button"
            onClick={resume}
            style={{
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
    </div>
  );
}
