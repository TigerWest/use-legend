import { observable, useObservable, useObserveIgnorable } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../../_shared";

const source$ = observable(0);

export default function UseObserveIgnorableDemo() {
  const log$ = useObservable<string[]>([]);

  const { ignoreUpdates, isIgnoring$ } = useObserveIgnorable(
    () => source$.get(),
    (value) => {
      log$.set((prev) => [`effect fired → ${value}`, ...prev].slice(0, 5));
    }
  );

  return (
    <DemoShell eyebrow="Observe">
      <DemoPanel
        title="useObserveIgnorable"
        description="Update the source normally or inside ignoreUpdates to suppress the effect."
        aside={
          <StatusBadge
            label={isIgnoring$.get() ? "Ignoring" : "Listening"}
            tone={isIgnoring$.get() ? "neutral" : "green"}
          />
        }
      >
        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={() => source$.set((v) => v + 1)}
            tone="accent"
            grow
          >
            Normal update ({source$.get()})
          </ActionButton>
          <ActionButton
            onClick={() => ignoreUpdates(() => source$.set((v) => v + 1))}
            grow
          >
            Ignored update ({source$.get()})
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
