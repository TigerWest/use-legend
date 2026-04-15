import { useObservable, useRafFn } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatCard, StatusBadge, demoClasses } from "@demos/_shared";

export default function UseRafFnDemo() {
  const count$ = useObservable(0);
  const delta$ = useObservable(0);

  const { isActive$, pause, resume } = useRafFn(({ delta }) => {
    delta$.set(delta);
    count$.set(count$.peek() + 1);
  });

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="requestAnimationFrame"
        description="Tracks frame count and delta time."
        aside={<StatusBadge label={isActive$.get() ? "Running" : "Paused"} tone={isActive$.get() ? "green" : "orange"} />}
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="Frames" value={count$.get()} />
          <StatCard label="Delta" value={`${delta$.get().toFixed(0)}ms`} />
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={isActive$.get() ? pause : resume}
            tone={isActive$.get() ? "orange" : "green"}
          >
            {isActive$.get() ? "Pause" : "Resume"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
