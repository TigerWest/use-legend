import { useObservable } from "@legendapp/state/react";
import { useLastChanged } from ".";
import { DemoPanel, DemoShell, StatCard, ValueToken, demoClasses } from "../../shared/_demo";

function formatTimestamp(ts: number | null): string {
  if (ts === null) return "—";
  return new Date(ts).toLocaleTimeString();
}

export default function UseLastChangedDemo() {
  const text$ = useObservable("");
  const textLastChanged$ = useLastChanged(text$);

  return (
    <DemoShell eyebrow="State Tracking">
      <DemoPanel
        title="Text input"
        description="Type to update the text and track the last change timestamp."
        aside={<ValueToken>{formatTimestamp(textLastChanged$.get())}</ValueToken>}
      >
        <input
          type="text"
          placeholder="Type something..."
          value={text$.get()}
          onChange={(e) => text$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={demoClasses.statsGrid}>
          <StatCard label="Last changed" value={textLastChanged$.get()} />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
