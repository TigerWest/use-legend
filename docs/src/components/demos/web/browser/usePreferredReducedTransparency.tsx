"use client";
import { usePreferredReducedTransparency } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UsePreferredReducedTransparencyDemo() {
  const transparency$ = usePreferredReducedTransparency();

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Reduced Transparency Preference"
        description="Tracks whether the user prefers reduced transparency."
        aside={
          <StatusBadge
            label={transparency$.get() === "reduce" ? "Reduced" : "Normal"}
            tone={transparency$.get() === "reduce" ? "orange" : "green"}
          />
        }
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: "1.5",
            opacity: 0.7,
          }}
        >
          {transparency$.get() === "reduce"
            ? "Your system prefers reduced transparency."
            : "Your system has no transparency preference."}
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
