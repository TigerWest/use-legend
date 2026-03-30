import { useScreenOrientation } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, orientation$, angle$ } = useScreenOrientation();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Screen Orientation"
        description="Tracks screen orientation via the Screen Orientation API."
        aside={
          <StatusBadge
            label={isSupported$.get() ? "Supported" : "Not Supported"}
            tone={isSupported$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
          <StatCard label="Orientation" value={orientation$.get() ?? "—"} tone="accent" />
          <StatCard label="Angle" value={`${angle$.get()}°`} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
