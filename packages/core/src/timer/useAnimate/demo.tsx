import { useRef$ } from "@elements/useRef$";
import { useAnimate } from ".";

export default function UseAnimateDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const {
    play,
    pause,
    reverse,
    finish,
    cancel,
    playState$,
    currentTime$,
    playbackRate$,
    pending$,
  } = useAnimate(
    el$,
    [
      { clipPath: "circle(20% at 0% 30%)" },
      { clipPath: "circle(20% at 50% 80%)" },
      { clipPath: "circle(20% at 100% 30%)" },
    ],
    {
      duration: 3000,
      iterations: 5,
      direction: "alternate",
      easing: "cubic-bezier(0.46, 0.03, 0.52, 0.96)",
    }
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "120px",
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
        }}
      >
        <div
          ref={el$}
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(135deg, var(--sl-color-accent, #6366f1), var(--sl-color-blue, #3b82f6))",
          }}
        />
      </div>

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
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>playState: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>{playState$.get()}</span>
        </div>
        <div>
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>currentTime: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>
            {currentTime$.get() != null ? `${Number(currentTime$.get()).toFixed(0)}ms` : "null"}
          </span>
        </div>
        <div>
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>playbackRate: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>{playbackRate$.get()}</span>
        </div>
        <div>
          <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>pending: </span>
          <span style={{ color: "var(--sl-color-white, #1e293b)" }}>{String(pending$.get())}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={playState$.get() === "running" ? pause : play}
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: `1px solid ${playState$.get() === "running" ? "var(--sl-color-orange, #f97316)" : "var(--sl-color-green, #22c55e)"}`,
            background:
              playState$.get() === "running"
                ? "var(--sl-color-orange-low, #fff7ed)"
                : "var(--sl-color-green-low, #f0fdf4)",
            color:
              playState$.get() === "running"
                ? "var(--sl-color-orange, #f97316)"
                : "var(--sl-color-green, #22c55e)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          {playState$.get() === "running" ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          onClick={reverse}
          style={{
            padding: "6px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid var(--sl-color-accent, #6366f1)",
            background: "transparent",
            color: "var(--sl-color-accent, #6366f1)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Reverse
        </button>

        <button
          type="button"
          onClick={finish}
          style={{
            padding: "6px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid var(--sl-color-blue, #3b82f6)",
            background: "transparent",
            color: "var(--sl-color-blue, #3b82f6)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Finish
        </button>

        <button
          type="button"
          onClick={cancel}
          style={{
            padding: "6px 16px",
            margin: 0,
            borderRadius: "6px",
            border: "1px solid var(--sl-color-red, #ef4444)",
            background: "transparent",
            color: "var(--sl-color-red, #ef4444)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
