import { Show, useCountdown } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "@demos/_shared";

export default function UseCountdownDemo() {
  const { remaining$, isActive$, pause, resume, reset, stop, start } = useCountdown(60);

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="Countdown"
        description="60-second countdown with pause, resume, reset, stop, and start controls."
        aside={<StatusBadge label={isActive$.get() ? "Running" : "Paused"} tone={isActive$.get() ? "green" : "orange"} />}
      >
        <div className={demoClasses.counterValue}>{remaining$.get()}</div>
        <div className={demoClasses.actionRow}>
          <Show
            if={isActive$}
            else={<ActionButton onClick={resume} tone="green" grow>Resume</ActionButton>}
          >
            <ActionButton onClick={pause} tone="orange" grow>Pause</ActionButton>
          </Show>
          <ActionButton onClick={() => reset()} tone="neutral" grow>Reset</ActionButton>
          <ActionButton onClick={stop} tone="neutral" grow>Stop</ActionButton>
          <ActionButton onClick={() => start()} tone="green" grow>Start</ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
