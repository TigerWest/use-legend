import { useRef$ } from "@usels/core";
import { useMouseInElement } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

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
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Mouse in Element"
        description="Move your mouse over the box to track position."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="elementX" value={`${Math.round(elementX$.get())}px`} />
          <StatCard label="elementY" value={`${Math.round(elementY$.get())}px`} />
          <StatCard
            label="isOutside"
            value={String(isOutside$.get())}
            tone={isOutside$.get() ? "orange" : "green"}
          />
          <StatCard label="width" value={`${Math.round(elementWidth$.get())}px`} />
          <StatCard label="height" value={`${Math.round(elementHeight$.get())}px`} />
          <StatCard label="x (global)" value={`${Math.round(x$.get())}px`} />
        </div>
        <div
          ref={el$}
          style={{
            position: "relative",
            width: "100%",
            height: "160px",
            border: "1px solid var(--sl-color-hairline-light)",
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--sl-color-gray-3)",
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
              background: "var(--sl-color-accent)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              opacity: isOutside$.get() ? 0 : 1,
              transition: "opacity 0.15s",
            }}
          />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
