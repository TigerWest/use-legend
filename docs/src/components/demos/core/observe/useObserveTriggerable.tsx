import { observable, useObservable, useObserveTriggerable } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, ValueToken, demoClasses } from "../../_shared";

const source$ = observable(0);

export default function UseObserveTriggerableDemo() {
  const log$ = useObservable<string[]>([]);

  const { trigger, ignoreUpdates } = useObserveTriggerable(
    () => source$.get(),
    (value) => {
      log$.set((prev) => [`effect fired → ${value}`, ...prev].slice(0, 5));
    }
  );

  return (
    <DemoShell eyebrow="Observe">
      <DemoPanel
        title="useObserveTriggerable"
        description="Reactively watch a source, or manually trigger the effect at any time."
      >
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => trigger()} grow tone="accent">
            Only trigger
          </ActionButton>
          <ActionButton onClick={() => source$.set((v) => v + 1)} grow>
            Update with trigger ({source$.get()})
          </ActionButton>
          <ActionButton onClick={() => ignoreUpdates(() => source$.set((v) => v + 1))} grow>
            ignore update ({source$.get()})
          </ActionButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {log$.get().length === 0 ? (
            <ValueToken>(no effect fired yet)</ValueToken>
          ) : (
            log$.get().map((entry, i) => <ValueToken key={i}>{entry}</ValueToken>)
          )}
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
