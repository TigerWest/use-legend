import { useLocalStorage } from "@usels/web";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatCard,
  StatusBadge,
  ValueToken,
  demoClasses,
} from "../../_shared";
import { Memo } from "@legendapp/state/react";

const THEMES = ["light", "dark", "system"] as const;

export default function Demo() {
  const theme$ = useLocalStorage<(typeof THEMES)[number]>("demo-theme", "light");

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="useLocalStorage"
        description="Persisted across reloads via localStorage. Reload the page — the value sticks."
        aside={<StatusBadge label="Persisted" tone="green" />}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <StatCard label="Key" value={<ValueToken>demo-theme</ValueToken>} />
          <StatCard label="Value" value={<ValueToken>{theme$.get()}</ValueToken>} tone="accent" />
        </div>
        <div className={demoClasses.actionRow}>
          <Memo>
            {THEMES.map((t) => (
              <ActionButton
                key={t}
                onClick={() => theme$.set(t)}
                tone={t === theme$.get() ? "accent" : "neutral"}
                grow
              >
                {t}
              </ActionButton>
            ))}
          </Memo>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
