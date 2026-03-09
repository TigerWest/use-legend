import { useStorage } from "@usels/core";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { ActionButton, DemoPanel, DemoShell, demoClasses } from "@demos/_shared";

export default function UseStorageDemo() {
  const { data$: count$ } = useStorage("demo-count", 0, {
    plugin: ObservablePersistLocalStorage,
  });

  return (
    <DemoShell eyebrow="Sync">
      <DemoPanel
        title="useStorage"
        description="Value persists across page reloads via localStorage."
      >
        <div className={demoClasses.counterRow}>
          <ActionButton onClick={() => count$.set((c) => c - 1)} tone="neutral">
            -1
          </ActionButton>
          <div className={demoClasses.counterValue}>{count$.get()}</div>
          <ActionButton onClick={() => count$.set((c) => c + 1)} tone="accent">
            +1
          </ActionButton>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => count$.set(0)} tone="neutral" grow>
            Reset
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
