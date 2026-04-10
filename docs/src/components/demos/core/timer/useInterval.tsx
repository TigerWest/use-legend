import { useInterval } from "@usels/core";
import { DemoPanel, DemoShell, StatCard } from "@demos/_shared";

export default function UseIntervalDemo() {
  const counter$ = useInterval(200);

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel title="Interval Counter" description="Counter increments every 200ms.">
        <StatCard label="Interval fired" value={counter$.get()} tone="accent" />
      </DemoPanel>
    </DemoShell>
  );
}
