import { useObservable } from "@legendapp/state/react";
import { useRef$ } from "@elements/useRef$";
import { useDraggable } from ".";

export default function Demo() {
  const el1$ = useRef$<HTMLDivElement>();
  const el2$ = useRef$<HTMLDivElement>();
  const el3$ = useRef$<HTMLDivElement>();
  const el4$ = useRef$<HTMLDivElement>();

  const disabled$ = useObservable(false);

  const drag1 = useDraggable(el1$, { preventDefault: true, initialValue: { x: 20, y: 20 } });
  const drag2 = useDraggable(el2$, {
    preventDefault: true,
    axis: "x",
    initialValue: { x: 20, y: 120 },
  });
  const drag3 = useDraggable(el3$, {
    preventDefault: true,
    axis: "y",
    initialValue: { x: 130, y: 120 },
  });
  const drag4 = useDraggable(el4$, {
    preventDefault: true,
    disabled: disabled$,
    initialValue: { x: 240, y: 120 },
  });

  const draggingLabel$ = useObservable(() =>
    drag1.isDragging$.get()
      ? "Basic"
      : drag2.isDragging$.get()
        ? "X only"
        : drag3.isDragging$.get()
          ? "Y only"
          : drag4.isDragging$.get()
            ? "Disabled toggle"
            : null
  );

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: 300,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Box 1: Basic free drag */}
        <div
          ref={el1$}
          style={{
            position: "absolute",
            left: drag1.x$.get(),
            top: drag1.y$.get(),
            width: 80,
            height: 80,
            background: drag1.isDragging$.get() ? "#4338ca" : "#6366f1",
            borderRadius: 8,
            cursor: drag1.isDragging$.get() ? "grabbing" : "grab",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            userSelect: "none",
            touchAction: "none",
            opacity: drag1.isDragging$.get() ? 0.85 : 1,
            fontSize: 11,
            fontWeight: 600,
            gap: 4,
          }}
        >
          Basic
        </div>

        {/* Box 2: X-axis only */}
        <div
          ref={el2$}
          style={{
            position: "absolute",
            left: drag2.x$.get(),
            top: drag2.y$.get(),
            width: 80,
            height: 80,
            background: drag2.isDragging$.get() ? "#059669" : "#10b981",
            borderRadius: 8,
            cursor: drag2.isDragging$.get() ? "grabbing" : "grab",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            userSelect: "none",
            touchAction: "none",
            opacity: drag2.isDragging$.get() ? 0.85 : 1,
            fontSize: 11,
            fontWeight: 600,
            gap: 4,
          }}
        >
          X only
        </div>

        {/* Box 3: Y-axis only */}
        <div
          ref={el3$}
          style={{
            position: "absolute",
            left: drag3.x$.get(),
            top: drag3.y$.get(),
            width: 80,
            height: 80,
            background: drag3.isDragging$.get() ? "#d97706" : "#f59e0b",
            borderRadius: 8,
            cursor: drag3.isDragging$.get() ? "grabbing" : "grab",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            userSelect: "none",
            touchAction: "none",
            opacity: drag3.isDragging$.get() ? 0.85 : 1,
            fontSize: 11,
            fontWeight: 600,
            gap: 4,
          }}
        >
          Y only
        </div>

        {/* Box 4: Disabled toggle */}
        <div
          ref={el4$}
          style={{
            position: "absolute",
            left: drag4.x$.get(),
            top: drag4.y$.get(),
            width: 80,
            height: 80,
            background: disabled$.get()
              ? "#9ca3af"
              : drag4.isDragging$.get()
                ? "#be123c"
                : "#f43f5e",
            borderRadius: 8,
            cursor: disabled$.get() ? "not-allowed" : drag4.isDragging$.get() ? "grabbing" : "grab",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            userSelect: "none",
            touchAction: "none",
            opacity: disabled$.get() ? 0.5 : drag4.isDragging$.get() ? 0.85 : 1,
            fontSize: 11,
            fontWeight: 600,
            gap: 4,
          }}
        >
          {disabled$.get() ? "Locked" : "Toggle"}
        </div>

        {/* Status line */}
        <p
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            fontSize: 12,
            color: "#6b7280",
            margin: 0,
          }}
        >
          {draggingLabel$.get() ? `Dragging: ${draggingLabel$.get()}` : "No active drag"}
        </p>
      </div>

      {/* Toggle button outside container */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => disabled$.set((v) => !v)}
          style={{
            padding: "4px 12px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            background: disabled$.get() ? "#f43f5e" : "#f3f4f6",
            color: disabled$.get() ? "#fff" : "#374151",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {disabled$.get() ? "Enable rose box" : "Disable rose box"}
        </button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          Rose box is currently {disabled$.get() ? "locked" : "draggable"}
        </span>
      </div>
    </div>
  );
}
