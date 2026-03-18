import { useDeviceOrientation } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const {
    isSupported$,
    needsPermission$,
    hasRealData$,
    ensurePermission,
    isAbsolute$,
    alpha$,
    beta$,
    gamma$,
  } = useDeviceOrientation();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Device Orientation"
        description="Tracks device orientation angles via the DeviceOrientation API. Best tested on a mobile device."
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
        {needsPermission$.get() && (
          <div className="mb-3">
            <ActionButton onClick={ensurePermission} tone="accent">
              Request Permission
            </ActionButton>
          </div>
        )}
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Alpha (Z)" value={alpha$.get()?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Beta (X)" value={beta$.get()?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Gamma (Y)" value={gamma$.get()?.toFixed(2) ?? "—"} tone="accent" />
          <StatCard label="Absolute" value={isAbsolute$.get() ? "Yes" : "No"} tone="neutral" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
