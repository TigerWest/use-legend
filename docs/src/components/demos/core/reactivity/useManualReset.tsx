import { useManualReset } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, ValueToken, demoClasses } from "@demos/_shared";
import { useObservable } from "@legendapp/state/react";

export default function UseManualResetDemo() {
  const obs = useObservable("hello");
  const { value$, reset } = useManualReset(obs);

  return (
    <DemoShell eyebrow="Manual Reset">
      <DemoPanel
        title="Editable field"
        description="Type anything, then press Reset to restore the initial value."
      >
        <input
          type="text"
          value={value$.get()}
          onChange={(e) => value$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={reset} grow>
            Reset
          </ActionButton>
        </div>
        <div className={demoClasses.valueRow}>
          <ValueToken>{value$.get() || "(empty)"}</ValueToken>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
