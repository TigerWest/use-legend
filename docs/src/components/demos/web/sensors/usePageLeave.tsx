"use client";
import { usePageLeave } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const isLeft$ = usePageLeave();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Page Leave"
        description="Move your mouse outside the browser window to detect page leave."
        aside={
          <StatusBadge
            label={isLeft$.get() ? "Left Page" : "On Page"}
            tone={isLeft$.get() ? "orange" : "green"}
          />
        }
      >
        <div className="grid h-20 place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] text-[14px] font-bold text-[var(--sl-color-text)]">
          {isLeft$.get() ? "Mouse has left the page!" : "Mouse is on the page"}
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
