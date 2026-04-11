import { useObservable } from "@legendapp/state/react";
import { useRef$ } from "@usels/core";
import { useDraggable } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

export default function Demo() {
  const el1$ = useRef$<HTMLDivElement>();
  const el2$ = useRef$<HTMLDivElement>();
  const el3$ = useRef$<HTMLDivElement>();
  const el4$ = useRef$<HTMLDivElement>();

  const disabled$ = useObservable(false);

  // Destructure each drag result into `$`-suffixed locals so the auto-wrap
  // babel plugin detects the observable reads inside JSX and sets up the
  // fine-grained reactivity boundaries.
  const {
    x$: x1$,
    y$: y1$,
    isDragging$: isDragging1$,
  } = useDraggable(el1$, { preventDefault: true, initialValue: { x: 20, y: 20 } });
  const {
    x$: x2$,
    y$: y2$,
    isDragging$: isDragging2$,
  } = useDraggable(el2$, {
    preventDefault: true,
    axis: "x",
    initialValue: { x: 20, y: 120 },
  });
  const {
    x$: x3$,
    y$: y3$,
    isDragging$: isDragging3$,
  } = useDraggable(el3$, {
    preventDefault: true,
    axis: "y",
    initialValue: { x: 130, y: 120 },
  });
  const {
    x$: x4$,
    y$: y4$,
    isDragging$: isDragging4$,
  } = useDraggable(el4$, {
    preventDefault: true,
    disabled: disabled$,
    initialValue: { x: 240, y: 120 },
  });

  const draggingLabel$ = useObservable(() =>
    isDragging1$.get()
      ? "Basic"
      : isDragging2$.get()
        ? "X only"
        : isDragging3$.get()
          ? "Y only"
          : isDragging4$.get()
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
              left: x1$.get(),
              top: y1$.get(),
              width: 80,
              height: 80,
              background: isDragging1$.get() ? "#4338ca" : "#6366f1",
              borderRadius: 8,
              cursor: isDragging1$.get() ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: isDragging1$.get() ? 0.85 : 1,
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
              left: x2$.get(),
              top: y2$.get(),
              width: 80,
              height: 80,
              background: isDragging2$.get() ? "#059669" : "#10b981",
              borderRadius: 8,
              cursor: isDragging2$.get() ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: isDragging2$.get() ? 0.85 : 1,
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
              left: x3$.get(),
              top: y3$.get(),
              width: 80,
              height: 80,
              background: isDragging3$.get() ? "#d97706" : "#f59e0b",
              borderRadius: 8,
              cursor: isDragging3$.get() ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: isDragging3$.get() ? 0.85 : 1,
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
              left: x4$.get(),
              top: y4$.get(),
              width: 80,
              height: 80,
              background: disabled$.get()
                ? "#9ca3af"
                : isDragging4$.get()
                  ? "#be123c"
                  : "#f43f5e",
              borderRadius: 8,
              cursor: disabled$.get()
                ? "not-allowed"
                : isDragging4$.get()
                  ? "grabbing"
                  : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              userSelect: "none",
              touchAction: "none",
              opacity: disabled$.get() ? 0.5 : isDragging4$.get() ? 0.85 : 1,
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
