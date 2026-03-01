import { useRef$ } from "../useRef$";
import { useMouseInElement } from ".";

export default function UseMouseInElementDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const {
    elementX$,
    elementY$,
    isOutside$,
    elementWidth$,
    elementHeight$,
    x$,
    y$: _y$,
  } = useMouseInElement(el$);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Stats readout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
          fontFamily: "monospace",
          fontSize: "13px",
          padding: "10px 14px",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          borderRadius: "6px",
        }}
      >
        {(
          [
            ["elementX", `${Math.round(elementX$.get())}px`],
            ["elementY", `${Math.round(elementY$.get())}px`],
            ["isOutside", String(isOutside$.get())],
            ["width", `${Math.round(elementWidth$.get())}px`],
            ["height", `${Math.round(elementHeight$.get())}px`],
            ["x (global)", `${Math.round(x$.get())}px`],
          ] as [string, string][]
        ).map(([label, val]) => (
          <span key={label}>
            {label}: <strong>{val}</strong>
          </span>
        ))}
      </div>

      {/* Hover target with tracking dot */}
      <div
        ref={el$}
        style={{
          position: "relative",
          width: "100%",
          height: "160px",
          border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "var(--sl-color-gray-3, #94a3b8)",
          cursor: "crosshair",
        }}
      >
        move your mouse here
        <div
          style={{
            position: "absolute",
            left: elementX$.get(),
            top: elementY$.get(),
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "var(--sl-color-accent, #818cf8)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: isOutside$.get() ? 0 : 1,
            transition: "opacity 0.15s",
          }}
        />
      </div>
    </div>
  );
}
