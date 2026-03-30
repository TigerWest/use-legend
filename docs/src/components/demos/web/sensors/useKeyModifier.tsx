"use client";
import { useKeyModifier } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";
import { useObserve } from "@legendapp/state/react";

export default function Demo() {
  const shift$ = useKeyModifier("Shift");
  const ctrl$ = useKeyModifier("Control");
  const alt$ = useKeyModifier("Alt");
  const meta$ = useKeyModifier("Meta");
  const capsLock$ = useKeyModifier("CapsLock");

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Key Modifier"
        description="Press modifier keys to see their state change in real-time."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={`Shift: ${shift$.get() ? "On" : "Off"}`}
            tone={shift$.get() ? "green" : "neutral"}
          />
          <StatusBadge
            label={`Ctrl: ${ctrl$.get() ? "On" : "Off"}`}
            tone={ctrl$.get() ? "green" : "neutral"}
          />
          <StatusBadge
            label={`Alt: ${alt$.get() ? "On" : "Off"}`}
            tone={alt$.get() ? "green" : "neutral"}
          />
          <StatusBadge
            label={`Meta: ${meta$.get() ? "On" : "Off"}`}
            tone={meta$.get() ? "green" : "neutral"}
          />
          <StatusBadge
            label={`CapsLock: ${capsLock$.get() ? "On" : "Off"}`}
            tone={capsLock$.get() ? "green" : "neutral"}
          />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
