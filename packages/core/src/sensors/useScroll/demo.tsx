import { useRef$ } from "../../elements/useRef$";
import { useScroll } from ".";

const badge = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontFamily: "monospace",
  background: active ? "var(--sl-color-green-low, #f0fdf4)" : "var(--sl-color-gray-5, #f1f5f9)",
  color: active ? "var(--sl-color-green, #16a34a)" : "var(--sl-color-gray-3, #64748b)",
  border: `1px solid ${active ? "var(--sl-color-green, #22c55e)" : "var(--sl-color-gray-4, #e2e8f0)"}`,
  transition: "all 0.15s",
});

export default function UseScrollDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$, isScrolling$, arrivedState$, directions$ } = useScroll(el$);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Stats */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f8fafc)",
          fontFamily: "monospace",
          fontSize: "13px",
        }}
      >
        <span>
          x: <strong>{x$.get()}</strong>
        </span>
        <span>
          y: <strong>{y$.get()}</strong>
        </span>
        <span style={badge(isScrolling$.get())}>{isScrolling$.get() ? "scrolling" : "idle"}</span>
        <span style={badge(arrivedState$.top.get())}>top</span>
        <span style={badge(arrivedState$.bottom.get())}>bottom</span>
        <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>
          {directions$.top.get() && "↑"}
          {directions$.bottom.get() && "↓"}
          {directions$.left.get() && "←"}
          {directions$.right.get() && "→"}
        </span>
      </div>

      {/* Scrollable container */}
      <div
        ref={el$}
        style={{
          height: "200px",
          overflowY: "auto",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-7, #fff)",
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--sl-color-gray-6, #f1f5f9)",
              fontSize: "13px",
              color: "var(--sl-color-gray-2, #475569)",
              fontFamily: "monospace",
            }}
          >
            Item {i + 1}
          </div>
        ))}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        Scroll inside the box to see x, y, arrivedState, and directions update.
      </p>
    </div>
  );
}
