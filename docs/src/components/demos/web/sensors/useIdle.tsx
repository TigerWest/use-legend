import { useIdle } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge, ActionButton } from "../../_shared";

export default function Demo() {
  const { idle$, lastActive$, reset } = useIdle({ timeout: 5000 });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Idle Detection"
        description="Tracks user inactivity. Becomes idle after 5 seconds of no interaction."
        aside={
          <StatusBadge
            label={idle$.get() ? "Idle" : "Active"}
            tone={idle$.get() ? "orange" : "green"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard
            label="Last Active"
            value={new Date(lastActive$.get()).toLocaleTimeString()}
            tone="accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={reset} tone="accent" grow>
            Reset Timer
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
