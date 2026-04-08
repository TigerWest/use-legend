import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useThrottledHistory } from "@usels/core";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "@demos/_shared";

export default function UseThrottledHistoryDemo() {
  const value$ = useObservable(50);
  const throttleMs$ = useObservable(300);
  const { undo, redo, canUndo$, canRedo$, history$ } = useThrottledHistory(value$, { throttle: throttleMs$ });
  return (
    <DemoShell eyebrow="Throttled Sampling">
      <DemoPanel
        title="Sampled slider"
        description="Drag aggressively and notice how the timeline keeps only periodic checkpoints."
        aside={<StatusBadge label={`Up to 1 commit / ${throttleMs$.get()}ms`} tone="neutral" />}
      >
        <div className={demoClasses.settingRow}>
          <ValueToken>Value: {value$.get()}</ValueToken>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel} htmlFor="throttled-history-delay">
              Throttle (ms)
            </label>
            <input
              id="throttled-history-delay"
              type="number"
              min={50}
              step={50}
              inputMode="numeric"
              value={throttleMs$.get()}
              onChange={(e) => {
                const next = e.target.valueAsNumber;
                if (!Number.isNaN(next)) throttleMs$.set(Math.max(50, next));
              }}
              className={demoClasses.numberInput}
            />
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value$.get()}
          onChange={(e) => value$.set(Number(e.target.value))}
          className={demoClasses.slider}
        />
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
        title="Throttled timeline"
        emptyText="Move the slider to start sampling values."
        history$={history$}
        tone="accent"
        renderSnapshot={(record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
          <ValueToken>{String(record$.snapshot.get())}</ValueToken>
        )}
      />
    </DemoShell>
  );
}
