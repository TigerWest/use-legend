import { useObservable } from "@legendapp/state/react";
import { useThrottled } from "@usels/core";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "@demos/_shared";

export default function UseThrottledDemo() {
  const source$ = useObservable("");
  const throttled$ = useThrottled(source$, { ms: 500 });

  return (
    <DemoShell eyebrow="Throttle">
      <DemoPanel
        title="Throttled input"
        description="Type to see the throttled value update at most every 500ms."
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
          <StatCard label="Throttled (500ms)" value={throttled$.get() || "—"} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
