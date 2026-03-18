"use client";
import { useElementByPoint } from "@usels/web";
import { useMouse } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge, ActionButton } from "../../_shared";

export default function Demo() {
  const { x$, y$ } = useMouse();
  const { element$, isActive$, isSupported$, pause, resume } = useElementByPoint({
    x: x$,
    y: y$,
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="useElementByPoint"
        description="Move your mouse around to detect elements at the cursor position."
        aside={
          <StatusBadge
            label={isSupported$.get() ? "Supported" : "Not Supported"}
            tone={isSupported$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Tag" value={element$.get()?.tagName ?? "—"} tone="accent" />
          <StatCard label="X" value={x$.get()} tone="neutral" />
          <StatCard label="Y" value={y$.get()} tone="neutral" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={isActive$.get() ? pause : resume} tone="accent" grow>
            {isActive$.get() ? "Pause" : "Resume"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
