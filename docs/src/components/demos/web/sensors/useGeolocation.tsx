import { useGeolocation } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge, ActionButton } from "../../_shared";

export default function Demo() {
  const { isSupported$, isActive$, coords$, locatedAt$, error$, pause, resume } = useGeolocation({ immediate: false });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Geolocation"
        description="Track your geographic position. Click Start to begin."
        aside={
          <div className="flex gap-2">
            <StatusBadge
              label={isSupported$.get() ? "Supported" : "Not Supported"}
              tone={isSupported$.get() ? "green" : "orange"}
            />
            <StatusBadge
              label={isActive$.get() ? "Tracking" : "Paused"}
              tone={isActive$.get() ? "green" : "neutral"}
            />
          </div>
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Latitude" value={coords$.get().latitude === Infinity ? "—" : coords$.get().latitude.toFixed(4)} tone="accent" />
          <StatCard label="Longitude" value={coords$.get().longitude === Infinity ? "—" : coords$.get().longitude.toFixed(4)} tone="accent" />
          <StatCard label="Accuracy" value={coords$.get().accuracy ? `${coords$.get().accuracy.toFixed(0)}m` : "—"} tone="neutral" />
        </div>
        {error$.get() && <p className="text-[12px] text-[var(--sl-color-orange)]">Error: {error$.get()?.message}</p>}
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={resume} tone="accent" grow>Start</ActionButton>
          <ActionButton onClick={pause} tone="neutral" grow>Pause</ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
