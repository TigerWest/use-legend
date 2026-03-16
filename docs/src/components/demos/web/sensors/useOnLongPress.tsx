import { useRef, useState } from "react";
import { useObservable } from "@legendapp/state/react";
import { useRef$ } from "@usels/core";
import { useOnLongPress } from "@usels/web";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatusBadge,
  StatCard,
  demoClasses,
} from "../../_shared";

export default function UseOnLongPressDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const count$ = useObservable(0);
  const lastDuration$ = useObservable<number | null>(null);
  const pressing$ = useObservable(false);

  useOnLongPress(el$, () => {
    count$.set((v) => v + 1);
  }, {
    delay: 500,
    onMouseUp: (duration, _distance, isLongPress) => {
      pressing$.set(false);
      if (isLongPress) {
        lastDuration$.set(Math.round(duration));
      }
    },
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="useOnLongPress"
        description="Press and hold the box for 500ms to trigger a long press."
        aside={
          <StatusBadge
            label={pressing$.get() ? "Pressing..." : "Idle"}
            tone={pressing$.get() ? "orange" : "neutral"}
          />
        }
      >
        <div
          ref={el$}
          onPointerDown={() => pressing$.set(true)}
          onPointerUp={() => pressing$.set(false)}
          onPointerLeave={() => pressing$.set(false)}
          style={{
            display: "grid",
            placeItems: "center",
            height: 120,
            borderRadius: 16,
            border: "2px dashed var(--sl-color-gray-4)",
            background: pressing$.get()
              ? "var(--sl-color-accent-low)"
              : "var(--sl-color-bg)",
            cursor: "pointer",
            userSelect: "none",
            transition: "background 0.15s",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--sl-color-text)",
          }}
        >
          {pressing$.get() ? "Keep holding..." : "Press and hold here"}
        </div>

        <div className={demoClasses.statsGrid}>
          <StatCard
            label="Long Presses"
            value={count$.get()}
            tone="accent"
          />
          <StatCard
            label="Last Duration"
            value={lastDuration$.get() != null ? `${lastDuration$.get()}ms` : "—"}
            tone="neutral"
          />
        </div>

        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={() => {
              count$.set(0);
              lastDuration$.set(null);
            }}
            tone="neutral"
            grow
          >
            Reset
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
