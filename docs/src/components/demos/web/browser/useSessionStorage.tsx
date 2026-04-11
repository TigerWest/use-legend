import { useSessionStorage } from "@usels/web";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatCard,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../../_shared";

const TOTAL_STEPS = 5;

export default function Demo() {
  const step$ = useSessionStorage("demo-wizard-step", 1);

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="useSessionStorage"
        description="Persisted only for this browser session. Closes with the tab, survives reloads."
        aside={<StatusBadge label="Session" tone="orange" />}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <StatCard label="Key" value={<ValueToken>demo-wizard-step</ValueToken>} />
          <StatCard
            label="Step"
            value={
              <ValueToken>
                {step$.get()} / {TOTAL_STEPS}
              </ValueToken>
            }
            tone="accent"
          />
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={() => step$.set(Math.max(1, step$.get() - 1))}
            disabled={step$.get() <= 1}
            tone="neutral"
            grow
          >
            Back
          </ActionButton>
          <ActionButton
            onClick={() => step$.set(Math.min(TOTAL_STEPS, step$.get() + 1))}
            disabled={step$.get() >= TOTAL_STEPS}
            tone="accent"
            grow
          >
            Next
          </ActionButton>
          <ActionButton onClick={() => step$.set(1)} tone="neutral" grow>
            Reset
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
