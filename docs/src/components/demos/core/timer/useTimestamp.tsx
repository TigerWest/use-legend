import { useTimestamp } from "@usels/core";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "@demos/_shared";

export default function UseTimestampDemo() {
  const timestamp$ = useTimestamp();

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel title="Timestamp" description="Updates every frame via requestAnimationFrame.">
        <div className={demoClasses.statsGrid}>
          <StatCard label="Timestamp" value={timestamp$.get()} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
