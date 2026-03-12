"use client";
import { usePreferredContrast } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UsePreferredContrastDemo() {
  const contrast$ = usePreferredContrast();

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Contrast Preference"
        description="Tracks the user's preferred contrast level."
        aside={
          <StatusBadge
            label={contrast$.get()}
            tone={contrast$.get() === "more" ? "orange" : "neutral"}
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
          Current preference: <strong>{contrast$.get()}</strong>
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
