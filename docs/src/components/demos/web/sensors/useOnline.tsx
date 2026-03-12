"use client";
import { useOnline } from "@usels/web";
import { DemoShell, DemoPanel, StatusBadge } from "../../_shared";

export default function UseOnlineDemo() {
  const isOnline$ = useOnline();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Online Status"
        description="Tracks whether the browser is currently online."
        aside={
          <StatusBadge
            label={isOnline$.get() ? "Online" : "Offline"}
            tone={isOnline$.get() ? "green" : "orange"}
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
          {isOnline$.get()
            ? "You are connected to the internet."
            : "You have lost your internet connection."}
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
