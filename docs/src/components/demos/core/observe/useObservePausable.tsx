import { observable, useObservable, useObservePausable } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../../_shared";

const count$ = observable(0);

export default function UseObservePausableDemo() {
  const log$ = useObservable<string[]>([]);

  const { isActive$, pause, resume } = useObservePausable(
    () => count$.get(),
    (value) => {
      log$.set((prev) => [`count → ${value}`, ...prev].slice(0, 5));
    }
  );

  return (
    <DemoShell eyebrow="Observe">
      <DemoPanel
        title="useObservePausable"
        description="Reactive effect with pause/resume controls."
        aside={
          <StatusBadge
            label={isActive$.get() ? "Active" : "Paused"}
            tone={isActive$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => count$.set((v) => v + 1)} tone="accent" grow>
            Increment count ({count$.get()})
          </ActionButton>
        </div>
        <div className={demoClasses.actionRow}>
          {isActive$.get() ? (
            <ActionButton onClick={pause} grow>
              Pause
            </ActionButton>
          ) : (
            <ActionButton onClick={resume} tone="green" grow>
              Resume
            </ActionButton>
          )}
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
