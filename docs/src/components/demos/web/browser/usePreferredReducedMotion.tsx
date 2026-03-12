"use client";
import { usePreferredReducedMotion } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UsePreferredReducedMotionDemo() {
  const motion$ = usePreferredReducedMotion();

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Reduced Motion Preference"
        description="Tracks whether the user prefers reduced motion."
        aside={
          <StatusBadge
            label={motion$.get() === "reduce" ? "Reduced" : "Normal"}
            tone={motion$.get() === "reduce" ? "orange" : "green"}
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
          {motion$.get() === "reduce"
            ? "Your system prefers reduced motion. Animations should be minimized."
            : "Your system has no motion preference. Animations are fine to use."}
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
