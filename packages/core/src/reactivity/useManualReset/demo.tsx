import { useManualReset } from ".";
import { ActionButton, DemoPanel, DemoShell, ValueToken, demoClasses } from "../../shared/_demo";

export default function UseManualResetDemo() {
  const { value$, reset } = useManualReset("hello");

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
