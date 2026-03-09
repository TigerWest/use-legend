import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "@demos/_shared";

export default function UseDebouncedDemo() {
  const source$ = useObservable("");
  const debounced$ = useDebounced(source$, 500, { maxWait: 1000 });

  return (
    <DemoShell eyebrow="Debounce">
      <DemoPanel
        title="Debounced input"
        description="Type to see the debounced value update after 500ms of inactivity."
      >
        <input
          type="text"
          placeholder="Type something..."
          value={source$.get()}
          onChange={(e) => source$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={demoClasses.statsGrid}>
          <StatCard label="Source" value={source$.get() || "—"} />
          <StatCard label="Debounced (500ms)" value={debounced$.get() || "—"} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
