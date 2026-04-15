import { useObservable, useRef$ } from "@usels/core";
import { useOnElementRemoval } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const visible$ = useObservable(true);
  const removedCount$ = useObservable(0);
  const ref = useRef$<HTMLDivElement>();

  useOnElementRemoval(ref, () => {
    removedCount$.set((c) => c + 1);
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="On Element Removal"
        description="Click Remove to remove the element. The hook detects its removal."
        aside={
          <StatusBadge
            label={`Removed: ${removedCount$.get()}x`}
            tone={removedCount$.get() > 0 ? "green" : "neutral"}
          />
        }
      >
        <div className="grid h-24 place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg-nav)]">
          {visible$.get() ? (
            <div
              ref={ref}
              className="rounded-lg bg-[var(--sl-color-accent)] px-4 py-2 text-white text-[14px]"
            >
              Target Element
            </div>
          ) : (
            <span className="text-[14px] text-[var(--sl-color-text-badge)]">Element removed</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={() => visible$.set((v) => !v)} tone={visible$.get() ? "accent" : "neutral"} grow>
            {visible$.get() ? "Remove" : "Restore"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
