import { useManualHistory, useObservable, type Observable } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "@demos/_shared";

export default function UseManualHistoryDemo() {
  const counter$ = useObservable(0);
  const { commit, undo, redo, canUndo$, canRedo$, history$ } = useManualHistory(counter$);
  return (
    <DemoShell eyebrow="Manual Save Points">
      <DemoPanel
        title="Counter draft"
        description="Increment or decrement first, then decide when that state deserves a place in history."
        aside={
          <StatusBadge
            label={history$.get()[0]?.snapshot !== counter$.get() ? "Dirty draft" : "Saved"}
            tone={history$.get()[0]?.snapshot !== counter$.get() ? "orange" : "green"}
          />
        }
      >
        <div className={demoClasses.counterRow}>
          <ActionButton onClick={() => counter$.set((v) => v - 1)} tone="neutral">
            -1
          </ActionButton>
          <div className={demoClasses.counterValue}>{counter$.get()}</div>
          <ActionButton onClick={() => counter$.set((v) => v + 1)} tone="neutral">
            +1
          </ActionButton>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={commit} tone="green" grow>
            Save snapshot
          </ActionButton>
          <ActionButton onClick={undo} disabled={!canUndo$.get()} grow>
            Undo
          </ActionButton>
          <ActionButton onClick={redo} disabled={!canRedo$.get()} grow>
            Redo
          </ActionButton>
        </div>
      </DemoPanel>

      <HistoryList
        title="Saved timeline"
        emptyText="Press Save snapshot to create the first manual checkpoint."
        history$={history$}
        tone="accent"
        renderSnapshot={(record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
          <ValueToken>{String(record$.snapshot.get())}</ValueToken>
        )}
      />
    </DemoShell>
  );
}
