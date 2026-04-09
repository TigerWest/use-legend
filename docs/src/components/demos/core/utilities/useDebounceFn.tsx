import { useObservable } from "@legendapp/state/react";
import { useDebounceFn } from "@usels/core";
import { DemoPanel, DemoShell, StatCard, StatusBadge, demoClasses } from "../../_shared";

export default function UseDebounceFnDemo() {
  const input$ = useObservable("");
  const debounced$ = useObservable("");
  const callCount$ = useObservable(0);

  const debouncedUpdate = useDebounceFn((value: string) => {
    debounced$.set(value);
    callCount$.set((c) => c + 1);
  }, 500);

  return (
    <DemoShell eyebrow="Utilities">
      <DemoPanel
        title="useDebounceFn"
        description="Delays function execution until 500ms after the last call."
        aside={<StatusBadge label="500ms delay" tone="accent" />}
      >
        <input
          type="text"
          placeholder="Type something..."
          className={demoClasses.input}
          value={input$.get()}
          onChange={(e) => {
            input$.set(e.target.value);
            debouncedUpdate(e.target.value);
          }}
        />
        <div className={demoClasses.statsGrid}>
          <StatCard label="Input" value={input$.get() || "—"} />
          <StatCard label="Debounced" value={debounced$.get() || "—"} tone="accent" />
          <StatCard label="Call Count" value={callCount$.get()} tone="green" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
