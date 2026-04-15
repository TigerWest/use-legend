import { useRef } from "react";
import { useObservable, useObserveEffect } from "@usels/core";
import { useDocumentVisibility } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

export default function UseDocumentVisibilityDemo() {
  const visibility$ = useDocumentVisibility();
  const delayed$ = useObservable<DocumentVisibilityState>("visible");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useObserveEffect(() => {
    const state = visibility$.get();
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (state === "hidden") {
      delayed$.set("hidden");
    } else {
      timerRef.current = setTimeout(() => {
        delayed$.set("visible");
      }, 2000);
    }
  });

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Document Visibility"
        description='Switch to another tab and come back — the 2s delay row stays "hidden" long enough to confirm the transition.'
      >
        <div className={demoClasses.valueRow}>
          <span className="font-mono text-[13px] text-(--sl-color-gray-2)">Instant</span>
          <StatusBadge
            label={visibility$.get()}
            tone={visibility$.get() === "visible" ? "green" : "orange"}
          />
        </div>
        <div className={demoClasses.valueRow}>
          <span className="font-mono text-[13px] text-(--sl-color-gray-2)">2s delay</span>
          <StatusBadge
            label={delayed$.get()}
            tone={delayed$.get() === "visible" ? "green" : "orange"}
          />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
