"use client";
import { useRef$ } from "@usels/core";
import { useMousePressed } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge, demoClasses } from "../../_shared";

function MousePressedTracker() {
  const target$ = useRef$<HTMLDivElement>();
  const { pressed$, sourceType$ } = useMousePressed({ target: target$ });

  return (
    <>
      <div className={demoClasses.valueRow}>
        <StatusBadge
          label={pressed$.get() ? "Pressed" : "Released"}
          tone={pressed$.get() ? "green" : "neutral"}
        />
        <StatusBadge
          label={`Source: ${sourceType$.get() ?? "none"}`}
          tone={
            sourceType$.get() === "mouse"
              ? "accent"
              : sourceType$.get() === "touch"
                ? "orange"
                : "neutral"
          }
        />
      </div>
      <div
        ref={target$}
        style={{
          position: "relative",
          width: "100%",
          height: "140px",
          borderRadius: "12px",
          border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: "pointer",
          userSelect: "none",
          fontFamily: "monospace",
          fontSize: "13px",
          color: pressed$.get()
            ? "var(--sl-color-white, #fff)"
            : "var(--sl-color-gray-3, #94a3b8)",
          background: pressed$.get()
            ? "var(--sl-color-accent, #6366f1)"
            : "transparent",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
      >
        {pressed$.get() ? "holding..." : "press or touch here"}
      </div>
    </>
  );
}

export default function UseMousePressedDemo() {
  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="useMousePressed"
        description="Track mouse/touch press state reactively."
      >
        <MousePressedTracker />
      </DemoPanel>
    </DemoShell>
  );
}
