import { useScreenOrientation } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatCard, StatusBadge, demoClasses } from "../../_shared";

export default function Demo() {
  const { isSupported$, orientation$, angle$, lockOrientation, unlockOrientation } =
    useScreenOrientation();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Screen Orientation"
        description="Tracks and controls screen orientation via the Screen Orientation API."
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
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => lockOrientation("portrait")} tone="accent" grow>
            Lock Portrait
          </ActionButton>
          <ActionButton onClick={() => lockOrientation("landscape")} tone="accent" grow>
            Lock Landscape
          </ActionButton>
          <ActionButton onClick={unlockOrientation} tone="neutral" grow>
            Unlock
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
