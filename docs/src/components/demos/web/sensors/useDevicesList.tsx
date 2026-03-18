import { useDevicesList } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge, ActionButton } from "../../_shared";

export default function Demo() {
  const {
    isSupported$,
    videoInputs$,
    audioInputs$,
    audioOutputs$,
    permissionGranted$,
    ensurePermissions,
  } = useDevicesList();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Devices List"
        description="Enumerates media devices. Grant permissions to see device labels."
        aside={
          <StatusBadge
            label={isSupported$.get() ? "Supported" : "Not Supported"}
            tone={isSupported$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Cameras" value={videoInputs$.get().length} tone="accent" />
          <StatCard label="Microphones" value={audioInputs$.get().length} tone="accent" />
          <StatCard label="Speakers" value={audioOutputs$.get().length} tone="accent" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            onClick={() => ensurePermissions()}
            disabled={permissionGranted$.get()}
            tone="accent"
            grow
          >
            {permissionGranted$.get() ? "Permissions Granted" : "Request Permissions"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
