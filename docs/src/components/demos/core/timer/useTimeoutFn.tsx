import { useObservable } from "@legendapp/state/react";
import { useTimeoutFn } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, ValueToken, demoClasses } from "@demos/_shared";

const defaultText = "Please wait for 3 seconds";

export default function UseTimeoutFnDemo() {
  const text$ = useObservable(defaultText);

  const { start, isPending$ } = useTimeoutFn(() => {
    text$.set("Fired!");
  }, 3000);

  const restart = () => {
    text$.set(defaultText);
    start();
  };

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="Timeout Function"
        description="Fires a callback after 3 seconds."
        aside={<StatusBadge label={isPending$.get() ? "Pending" : "Fired"} tone={isPending$.get() ? "orange" : "green"} />}
      >
        <ValueToken>{text$.get()}</ValueToken>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={restart} disabled={isPending$.get()} tone="green">
            Restart
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
