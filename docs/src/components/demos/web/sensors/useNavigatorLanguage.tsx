import { useNavigatorLanguage } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, language$ } = useNavigatorLanguage();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Navigator Language"
        description="Tracks the browser's preferred language setting."
        aside={
          <StatusBadge
            label={isSupported$.get() ? "Supported" : "Not Supported"}
            tone={isSupported$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Language" value={language$.get() ?? "—"} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
