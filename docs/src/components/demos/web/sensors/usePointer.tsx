import { usePointer } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const { x$, y$, pressure$, pointerType$, isInside$, tiltX$, tiltY$, twist$ } = usePointer();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Pointer"
        description="Move your pointer (mouse, pen, or touch) to track its state."
        aside={
          <StatusBadge
            label={isInside$.get() ? "Inside" : "Outside"}
            tone={isInside$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="X" value={x$.get().toFixed(0)} tone="accent" />
          <StatCard label="Y" value={y$.get().toFixed(0)} tone="accent" />
          <StatCard label="Pressure" value={pressure$.get().toFixed(2)} tone="accent" />
          <StatCard label="Type" value={pointerType$.get() ?? "—"} tone="neutral" />
          <StatCard label="Tilt X" value={tiltX$.get().toFixed(0)} tone="neutral" />
          <StatCard label="Tilt Y" value={tiltY$.get().toFixed(0)} tone="neutral" />
          <StatCard label="Twist" value={twist$.get().toFixed(0)} tone="neutral" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
