import { useFps } from "@usels/core";
import { DemoPanel, DemoShell, StatCard } from "@demos/_shared";

export default function UseFpsDemo() {
  const fps$ = useFps();

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel title="FPS Monitor" description="Sampled every 10 frames using requestAnimationFrame.">
        <StatCard label="FPS" value={fps$.get()} tone="accent" />
      </DemoPanel>
    </DemoShell>
  );
}
