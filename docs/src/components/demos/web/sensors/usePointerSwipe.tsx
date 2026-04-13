"use client";
import { useRef$ } from "@usels/core";
import { usePointerSwipe, type UseSwipeDirection } from "@usels/web";
import { DemoShell, DemoPanel, StatCard, StatusBadge, demoClasses } from "../../_shared";

const directionTone = (dir: UseSwipeDirection) => {
  if (dir === "left" || dir === "right") return "accent" as const;
  if (dir === "up" || dir === "down") return "orange" as const;
  return "neutral" as const;
};

export default function UsePointerSwipeDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { isSwiping$, direction$, distanceX$, distanceY$ } = usePointerSwipe(el$, {
    threshold: 50,
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="usePointerSwipe"
        description="Detect swipe gestures using PointerEvents (mouse, touch, pen)."
      >
        <div
          className={demoClasses.statsGrid}
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}
        >
          <StatCard label="DistanceX" value={`${Math.round(distanceX$.get())}px`} tone="accent" />
          <StatCard label="DistanceY" value={`${Math.round(distanceY$.get())}px`} tone="accent" />
        </div>
        <div className={demoClasses.valueRow}>
          <StatusBadge
            label={`Direction: ${direction$.get()}`}
            tone={directionTone(direction$.get())}
          />
          <StatusBadge
            label={isSwiping$.get() ? "Swiping" : "Idle"}
            tone={isSwiping$.get() ? "green" : "neutral"}
          />
        </div>
        <div
          ref={el$}
          style={{
            position: "relative",
            width: "100%",
            height: "160px",
            borderRadius: "12px",
            border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            userSelect: "none",
            touchAction: "none",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--sl-color-gray-3, #94a3b8)",
          }}
        >
          swipe here (mouse or touch)
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
