import { useObservable, useRef$ } from "@usels/core";
import { useOnClickOutside } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, StatCard, demoClasses } from "../../_shared";

export default function UseOnClickOutsideDemo() {
  const panel$ = useRef$<HTMLDivElement>();
  const isOpen$ = useObservable(true);
  const count$ = useObservable(0);

  useOnClickOutside(panel$, () => {
    count$.set((v) => v + 1);
    isOpen$.set(false);
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Click Outside Detection"
        description="Click outside the blue panel to close it. The counter tracks outside clicks."
        aside={
          <StatusBadge
            label={isOpen$.get() ? "Open" : "Closed"}
            tone={isOpen$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="Outside Clicks" value={count$.get()} tone="accent" />
        </div>

        {isOpen$.get() ? (
          <div
            ref={panel$}
            className="rounded-xl border-2 border-dashed border-[var(--sl-color-accent)] bg-[var(--sl-color-accent-low)] p-4 text-center text-sm font-medium text-[var(--sl-color-accent-high)]"
          >
            Click outside this panel
          </div>
        ) : (
          <div className={demoClasses.actionRow}>
            <ActionButton onClick={() => isOpen$.set(true)} tone="accent" grow>
              Reopen Panel
            </ActionButton>
          </div>
        )}
      </DemoPanel>
    </DemoShell>
  );
}
