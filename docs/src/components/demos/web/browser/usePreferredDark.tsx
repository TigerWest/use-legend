"use client";
import { usePreferredDark } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UsePreferredDarkDemo() {
  const isDark$ = usePreferredDark();

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Dark Mode Preference"
        description="Tracks the user's prefers-color-scheme: dark media query."
        aside={
          <StatusBadge
            label={isDark$.get() ? "Dark" : "Light"}
            tone={isDark$.get() ? "accent" : "neutral"}
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
          {isDark$.get()
            ? "Your system prefers dark mode."
            : "Your system prefers light mode."}
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
