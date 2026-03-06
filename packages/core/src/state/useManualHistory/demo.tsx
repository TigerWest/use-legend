import type { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { useManualHistory } from ".";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../_historyDemoUi";

export default function UseManualHistoryDemo() {
  const counter$ = useObservable(0);
  const { commit, undo, redo, canUndo$, canRedo$, history$ } = useManualHistory(counter$);
  const historyListProps = {
    title: "Saved timeline",
    emptyText: "Press Save snapshot to create the first manual checkpoint.",
    history$,
    tone: "green" as const,
    renderSnapshot: (record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
      <ValueToken>{String(record$.snapshot.get())}</ValueToken>
    ),
  };

  return (
    <DemoShell
      eyebrow="Manual Save Points"
      title="Draft freely, commit intentionally"
      description="The counter can move as much as you want, but history updates only when you explicitly save a snapshot."
    >
      <DemoPanel
        title="Counter draft"
        description="Increment or decrement first, then decide when that state deserves a place in history."
        tone="accent"
        aside={
          <Memo>
            {() => (
              <StatusBadge
                label={history$.get()[0]?.snapshot !== counter$.get() ? "Dirty draft" : "Saved"}
                tone={history$.get()[0]?.snapshot !== counter$.get() ? "orange" : "green"}
              />
            )}
          </Memo>
        }
      >
        <div className={demoClasses.counterRow}>
          <ActionButton onClick={() => counter$.set((v) => v - 1)} tone="neutral">
            -1
          </ActionButton>
          <Memo>{() => <div className={demoClasses.counterValue}>{counter$.get()}</div>}</Memo>
          <ActionButton onClick={() => counter$.set((v) => v + 1)} tone="neutral">
            +1
          </ActionButton>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={commit} tone="green" grow>
            Save snapshot
          </ActionButton>
          <Memo>
            {() => (
              <ActionButton onClick={undo} disabled={!canUndo$.get()} grow>
                Undo
              </ActionButton>
            )}
          </Memo>
          <Memo>
            {() => (
              <ActionButton onClick={redo} disabled={!canRedo$.get()} grow>
                Redo
              </ActionButton>
            )}
          </Memo>
        </div>
      </DemoPanel>

      <HistoryList {...historyListProps} />
    </DemoShell>
  );
}
