"use client";
import { usePreferredColorScheme } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UsePreferredColorSchemeDemo() {
  const scheme$ = usePreferredColorScheme();

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Color Scheme Preference"
        description="Tracks the user's preferred color scheme."
        aside={
          <StatusBadge
            label={scheme$.get()}
            tone={scheme$.get() === "dark" ? "accent" : scheme$.get() === "light" ? "orange" : "neutral"}
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
          Current preference: <strong>{scheme$.get()}</strong>
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
