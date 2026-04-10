import { Show, useObservable } from "@legendapp/state/react";
import { useIntervalFn } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, ValueToken } from "@demos/_shared";

const greetings = ["Hello", "Hi", "Yo!", "Hey", "Hola", "Bonjour", "Salut!", "Ciao"];

export default function UseIntervalFnDemo() {
  const word$ = useObservable("Hello");

  const { isActive$, pause, resume } = useIntervalFn(() => {
    word$.set(greetings[Math.floor(Math.random() * greetings.length)]);
  }, 500);

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="Interval Function"
        description="Cycles through greetings every 500ms."
        aside={<StatusBadge label={isActive$.get() ? "Running" : "Paused"} tone={isActive$.get() ? "green" : "orange"} />}
      >
        <ValueToken>{word$.get()}</ValueToken>
        <Show
          if={() => isActive$.get()}
          else={<ActionButton onClick={resume} tone="green">Resume</ActionButton>}
        >
          <ActionButton onClick={pause} tone="orange">Pause</ActionButton>
        </Show>
      </DemoPanel>
    </DemoShell>
  );
}
