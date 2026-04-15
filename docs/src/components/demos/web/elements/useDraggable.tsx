import { useObservable, useRef$ } from "@usels/core";
import { useDraggable } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

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
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Draggable"
        aside={
          <StatusBadge
            label={draggingLabel$.get() ? `Dragging: ${draggingLabel$.get()}` : "No active drag"}
            tone={draggingLabel$.get() ? "accent" : "neutral"}
          />
        }
      >
        <div
          style={{
            position: "relative",
            height: 300,
            border: "1px solid var(--sl-color-hairline-light)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
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
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: drag1.isDragging$.get() ? 0.85 : 1,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Basic
          </div>
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
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: drag2.isDragging$.get() ? 0.85 : 1,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            X only
          </div>
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
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: drag3.isDragging$.get() ? 0.85 : 1,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Y only
          </div>
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
              cursor: disabled$.get()
                ? "not-allowed"
                : drag4.isDragging$.get()
                  ? "grabbing"
                  : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: disabled$.get() ? 0.5 : drag4.isDragging$.get() ? 0.85 : 1,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {disabled$.get() ? "Locked" : "Toggle"}
          </div>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={() => disabled$.set((v) => !v)}
            tone={disabled$.get() ? "orange" : "neutral"}
          >
            {disabled$.get() ? "Enable rose box" : "Disable rose box"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
