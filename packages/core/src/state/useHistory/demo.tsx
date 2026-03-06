import type { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { useHistory } from ".";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../_historyDemoUi";

export default function UseHistoryDemo() {
  const text$ = useObservable("");
  const { undo, redo, canUndo$, canRedo$, isTracking$, pause, resume, history$ } =
    useHistory(text$);
  const historyListProps = {
    title: "History timeline",
    emptyText: "Start typing to create history entries.",
    history$,
    tone: "accent" as const,
    renderSnapshot: (record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
      <ValueToken>
        {record$.snapshot.get() === "" ? '""' : `"${String(record$.snapshot.get())}"`}
      </ValueToken>
    ),
  };

  return (
    <DemoShell
      eyebrow="Auto Tracking"
      title="Edit first, rewind later"
      description="Every keystroke becomes an undo checkpoint. Pause tracking when you want to experiment without polluting the stack."
    >
      <DemoPanel
        title="Live editor"
        description="Every change commits immediately while tracking is active."
        tone="accent"
        aside={
          <StatusBadge
            label={isTracking$.get() ? "Tracking on" : "Tracking off"}
            tone={isTracking$.get() ? "green" : "orange"}
          />
        }
      >
        <Memo>
          {() => (
            <input
              type="text"
              placeholder="Type here and watch the timeline update"
              value={text$.get()}
              onChange={(e) => text$.set(e.target.value)}
              className={demoClasses.input}
            />
          )}
        </Memo>
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
          <Memo>
            {() => (
              <ActionButton
                onClick={() => (isTracking$.get() ? pause() : resume())}
                tone={isTracking$.get() ? "orange" : "green"}
                grow
              >
                {isTracking$.get() ? "Pause tracking" : "Resume tracking"}
              </ActionButton>
            )}
          </Memo>
        </div>
      </DemoPanel>

      <HistoryList {...historyListProps} />
    </DemoShell>
  );
}
