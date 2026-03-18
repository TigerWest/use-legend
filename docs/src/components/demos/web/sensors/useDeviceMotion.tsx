import { useDeviceMotion } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const {
    isSupported$,
    requirePermission$,
    permissionGranted$,
    hasRealData$,
    ensurePermissions,
    acceleration$,
    rotationRate$,
    interval$,
  } = useDeviceMotion();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Device Motion"
        description="Tracks device acceleration and rotation rate via the DeviceMotion API. Best tested on a mobile device."
        aside={
          <div className="flex gap-2">
            <StatusBadge
              label={isSupported$.get() ? "Supported" : "Not Supported"}
              tone={isSupported$.get() ? "green" : "orange"}
            />
            {isSupported$.get() && (
              <StatusBadge
                label={hasRealData$.get() ? "Sensor Detected" : "No Sensor Hardware"}
                tone={hasRealData$.get() ? "green" : "orange"}
              />
            )}
          </div>
        }
      >
        {requirePermission$.get() && !permissionGranted$.get() && (
          <div className="mb-3">
            <ActionButton onClick={ensurePermissions} tone="accent">
              Request Permission
            </ActionButton>
          </div>
        )}
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Accel X" value={acceleration$.get().x?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Accel Y" value={acceleration$.get().y?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Accel Z" value={acceleration$.get().z?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Rotation α" value={rotationRate$.get().alpha?.toFixed(2) ?? "—"} tone="neutral" />
          <StatCard label="Rotation β" value={rotationRate$.get().beta?.toFixed(2) ?? "—"} tone="neutral" />
          <StatCard label="Rotation γ" value={rotationRate$.get().gamma?.toFixed(2) ?? "—"} tone="neutral" />
          <StatCard label="Interval" value={`${interval$.get()} ms`} tone="neutral" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
