import type { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { useConstant } from "@shared/useConstant";
import { useDebouncedHistory } from ".";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../_historyDemoUi";

export default function UseDebouncedHistoryDemo() {
  const text$ = useObservable("");
  const debounceMs$ = useObservable(600);
  const historyOptions = useConstant(() => ({ debounce: debounceMs$ }));
  const { undo, redo, canUndo$, canRedo$, history$ } = useDebouncedHistory(text$, historyOptions);
  const historyListProps = {
    title: "Debounced timeline",
    emptyText: "Type, pause briefly, and the settled value will appear here.",
    history$,
    tone: "green" as const,
    renderSnapshot: (record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
      <ValueToken>
        {record$.snapshot.get() === "" ? '""' : `"${String(record$.snapshot.get())}"`}
      </ValueToken>
    ),
  };

  return (
    <DemoShell
      eyebrow="Debounced Commits"
      title="Only settled input gets saved"
      description="Rapid typing stays fluid, but history records only after the input has been idle for 600ms."
    >
      <DemoPanel
        title="Settling editor"
        description="Type quickly, pause, then inspect how only the settled value lands in history."
        tone="green"
        aside={
          <Memo>
            {() => <StatusBadge label={`Commit after ${debounceMs$.get()}ms`} tone="green" />}
          </Memo>
        }
      >
        <Memo>
          {() => (
            <input
              type="text"
              placeholder="Type in bursts to see debounced history"
              value={text$.get()}
              onChange={(e) => text$.set(e.target.value)}
              className={demoClasses.input}
            />
          )}
        </Memo>
        <div className={demoClasses.settingRow}>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel} htmlFor="debounced-history-delay">
              Debounce (ms)
            </label>
            <Memo>
              {() => (
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
              )}
            </Memo>
          </div>
          <Memo>{() => <ValueToken>Snapshots: {history$.get().length}</ValueToken>}</Memo>
        </div>
        <div className={demoClasses.actionRow}>
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
