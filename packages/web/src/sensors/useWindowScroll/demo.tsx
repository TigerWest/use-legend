import { useWindowScroll } from ".";

const card: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  padding: "10px 14px",
  borderRadius: "6px",
  border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
  background: "var(--sl-color-gray-6, #f8fafc)",
  fontFamily: "monospace",
  fontSize: "13px",
};

const chip = (active: boolean): React.CSSProperties => ({
  padding: "2px 8px",
  borderRadius: "4px",
  background: active ? "var(--sl-color-green-low, #f0fdf4)" : "var(--sl-color-gray-5, #f1f5f9)",
  color: active ? "var(--sl-color-green, #16a34a)" : "var(--sl-color-gray-3, #64748b)",
  border: `1px solid ${active ? "var(--sl-color-green, #22c55e)" : "var(--sl-color-gray-5, #e2e8f0)"}`,
  transition: "all 0.15s",
});

export default function UseWindowScrollDemo() {
  const { x$, y$, isScrolling$, arrivedState$, directions$ } = useWindowScroll();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={card}>
        <span>
          x: <strong>{x$.get()}</strong>
        </span>
        <span>
          y: <strong>{y$.get()}</strong>
        </span>
        <span style={chip(isScrolling$.get())}>{isScrolling$.get() ? "scrolling" : "idle"}</span>
      </div>

      <div style={card}>
        <span style={chip(arrivedState$.top.get())}>top</span>
        <span style={chip(arrivedState$.bottom.get())}>bottom</span>
        <span style={chip(arrivedState$.left.get())}>left</span>
        <span style={chip(arrivedState$.right.get())}>right</span>
        <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>
          {directions$.top.get() && "↑ "}
          {directions$.bottom.get() && "↓ "}
          {directions$.left.get() && "← "}
          {directions$.right.get() && "→ "}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        Scroll the page to see the values update in real time.
      </p>
    </div>
  );
}
