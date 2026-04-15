import { useObservable, useThrottleFn } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatCard, StatusBadge, demoClasses } from "../../_shared";

export default function UseThrottleFnDemo() {
  const clickCount$ = useObservable(0);
  const throttledCount$ = useObservable(0);

  const throttledIncrement = useThrottleFn(() => {
    throttledCount$.set((c) => c + 1);
  }, 1000);

  return (
    <DemoShell eyebrow="Utilities">
      <DemoPanel
        title="useThrottleFn"
        description="Limits function execution to at most once per 1000ms, no matter how fast you click."
        aside={<StatusBadge label="1000ms limit" tone="orange" />}
      >
        <div className={demoClasses.actionRow}>
          <ActionButton
            tone="accent"
            grow
            onClick={() => {
              clickCount$.set((c) => c + 1);
              throttledIncrement();
            }}
          >
            Click rapidly!
          </ActionButton>
        </div>
        <div className={demoClasses.statsGrid}>
          <StatCard label="Clicks" value={clickCount$.get()} />
          <StatCard label="Throttled Calls" value={throttledCount$.get()} tone="orange" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
