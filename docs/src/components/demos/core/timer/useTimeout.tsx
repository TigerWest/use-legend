import { useTimeout } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "@demos/_shared";

export default function UseTimeoutDemo() {
  const { ready$, start } = useTimeout(1000, { controls: true });

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="Timeout"
        description="Ready becomes true after 1 second."
        aside={<StatusBadge label={ready$.get() ? "Ready" : "Waiting"} tone={ready$.get() ? "green" : "orange"} />}
      >
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => start()} disabled={!ready$.get()} tone="green">
            Start Again
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
