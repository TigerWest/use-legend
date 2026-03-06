import type { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { useConstant } from "@shared/useConstant";
import { useThrottledHistory } from ".";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  HistoryList,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../_historyDemoUi";

export default function UseThrottledHistoryDemo() {
  const value$ = useObservable(50);
  const throttleMs$ = useObservable(300);
  const historyOptions = useConstant(() => ({ throttle: throttleMs$ }));
  const { undo, redo, canUndo$, canRedo$, history$ } = useThrottledHistory(value$, historyOptions);
  const historyListProps = {
    title: "Throttled timeline",
    emptyText: "Move the slider to start sampling values.",
    history$,
    tone: "orange" as const,
    renderSnapshot: (record$: Observable<{ snapshot: unknown; timestamp: number }>) => (
      <ValueToken>{String(record$.snapshot.get())}</ValueToken>
    ),
  };

  return (
    <DemoShell
      eyebrow="Throttled Sampling"
      title="Capture motion without noise"
      description="For fast-moving values like sliders, history records at most once every 300ms instead of saving every intermediate frame."
    >
      <DemoPanel
        title="Sampled slider"
        description="Drag aggressively and notice how the timeline keeps only periodic checkpoints."
        tone="orange"
        aside={
          <Memo>
            {() => <StatusBadge label={`Up to 1 commit / ${throttleMs$.get()}ms`} tone="orange" />}
          </Memo>
        }
      >
        <div className={demoClasses.settingRow}>
          <Memo>{() => <ValueToken>Value: {value$.get()}</ValueToken>}</Memo>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel} htmlFor="throttled-history-delay">
              Throttle (ms)
            </label>
            <Memo>
              {() => (
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
              )}
            </Memo>
          </div>
        </div>
        <Memo>
          {() => (
            <input
              type="range"
              min={0}
              max={100}
              value={value$.get()}
              onChange={(e) => value$.set(Number(e.target.value))}
              className={demoClasses.slider}
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
        </div>
      </DemoPanel>

      <HistoryList {...historyListProps} />
    </DemoShell>
  );
}
