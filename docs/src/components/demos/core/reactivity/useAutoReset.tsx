import { useAutoReset } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "@demos/_shared";
import { useObservable } from "@legendapp/state/react";

export default function UseAutoResetDemo() {
  const source = useObservable("");
  const message$ = useAutoReset(source, { afterMs: 2000 });

  return (
    <DemoShell eyebrow="Auto Reset">
      <DemoPanel
        title="Flash message"
        description="Set a message and watch it reset to empty after 2 seconds."
        aside={
          <StatusBadge
            label={message$.get() ? "Active" : "Idle"}
            tone={message$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => message$.set("Saved!")} tone="green" grow>
            Save
          </ActionButton>
          <ActionButton onClick={() => message$.set("Error!")} tone="orange" grow>
            Error
          </ActionButton>
          <ActionButton onClick={() => message$.set("")} grow>
            Clear
          </ActionButton>
        </div>
        <div className={demoClasses.valueRow}>
          <ValueToken>{message$.get() || "(empty — resets after 2s)"}</ValueToken>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
