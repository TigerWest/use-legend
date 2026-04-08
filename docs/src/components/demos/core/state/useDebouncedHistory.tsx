import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useDebouncedHistory } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "@demos/_shared";

export default function UseDebouncedHistoryDemo() {
  const text$ = useObservable("");
  const debounceMs$ = useObservable(600);
  const { undo, redo, canUndo$, canRedo$, history$ } = useDebouncedHistory(text$, { debounce: debounceMs$ });
  return (
    <DemoShell eyebrow="Debounced Commits">
      <DemoPanel
        title="Settling editor"
        description="Type quickly, pause, then inspect how only the settled value lands in history."
        aside={<StatusBadge label={`Commit after ${debounceMs$.get()}ms`} tone="green" />}
      >
        <input
          type="text"
          placeholder="Type in bursts to see debounced history"
          value={text$.get()}
          onChange={(e) => text$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={demoClasses.settingRow}>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel} htmlFor="debounced-history-delay">
              Debounce (ms)
            </label>
            <input
              id="debounced-history-delay"
              type="number"
              min={50}
              step={50}
              inputMode="numeric"
              value={debounceMs$.get()}
              onChange={(e) => {
                const next = e.target.valueAsNumber;
                if (!Number.isNaN(next)) debounceMs$.set(Math.max(50, next));
              }}
              className={demoClasses.numberInput}
            />
          </div>
          <ValueToken>Snapshots: {history$.get().length}</ValueToken>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={undo} disabled={!canUndo$.get()} grow>
            Undo
          </ActionButton>
          <ActionButton onClick={redo} disabled={!canRedo$.get()} grow>
            Redo
          </ActionButton>
        </div>
      </DemoPanel>

      <HistoryList
        title="Debounced timeline"
        emptyText="Type, pause briefly, and the settled value will appear here."
        history$={history$}
        tone="green"
        renderSnapshot={(record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
          <ValueToken>
            {record$.snapshot.get() === "" ? '""' : `"${String(record$.snapshot.get())}"`}
          </ValueToken>
        )}
      />
    </DemoShell>
  );
}
