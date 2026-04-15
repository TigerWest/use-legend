"use client";
import { useObservable } from "@usels/core";
import { useOnKeyStroke } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

export default function Demo() {
  const lastKey$ = useObservable("—");
  const count$ = useObservable(0);

  useOnKeyStroke((e) => {
    lastKey$.set(e.key);
    count$.set((n) => n + 1);
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="On Key Stroke"
        description="Press any key to see it captured in real-time."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard
            label="Last Key"
            value={lastKey$.get()}
            tone={lastKey$.get() === "—" ? "neutral" : "accent"}
          />
          <StatCard
            label="Total Strokes"
            value={count$.get()}
            tone={count$.get() > 0 ? "green" : "neutral"}
          />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
