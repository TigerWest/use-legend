import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useDataHistory } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "@demos/_shared";

export default function UseDataHistoryDemo() {
  const text$ = useObservable("");
  const { undo, redo, canUndo$, canRedo$, isTracking$, pause, resume, history$ } =
    useDataHistory(text$);
  return (
    <DemoShell eyebrow="Auto Tracking">
      <DemoPanel
        title="Live editor"
        description="Every change commits immediately while tracking is active."
        aside={
          <StatusBadge
            label={isTracking$.get() ? "Tracking on" : "Tracking off"}
            tone={isTracking$.get() ? "green" : "orange"}
          />
        }
      >
        <input
          type="text"
          placeholder="Type here and watch the timeline update"
          value={text$.get()}
          onChange={(e) => text$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={undo} disabled={!canUndo$.get()} grow>
            Undo
          </ActionButton>
          <ActionButton onClick={redo} disabled={!canRedo$.get()} grow>
            Redo
          </ActionButton>
          <ActionButton
            onClick={() => (isTracking$.get() ? pause() : resume())}
            tone={isTracking$.get() ? "orange" : "green"}
            grow
          >
            {isTracking$.get() ? "Pause tracking" : "Resume tracking"}
          </ActionButton>
        </div>
      </DemoPanel>

      <HistoryList
        title="History timeline"
        emptyText="Start typing to create history entries."
        history$={history$}
        tone="accent"
        renderSnapshot={(record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
          <ValueToken>
            {record$.snapshot.get() === "" ? '""' : `"${String(record$.snapshot.get())}"`}
          </ValueToken>
        )}
      />
    </DemoShell>
  );
}
