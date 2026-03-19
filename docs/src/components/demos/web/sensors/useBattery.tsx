import { useBattery } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, charging$, level$, chargingTime$, dischargingTime$ } = useBattery();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Battery"
        description="Real-time battery status via the Battery Status API."
        aside={
          <StatusBadge
            label={
              !isSupported$.get()
                ? "Not Supported"
                : charging$.get()
                  ? "Charging"
                  : "Discharging"
            }
            tone={
              !isSupported$.get()
                ? "orange"
                : charging$.get()
                  ? "green"
                  : "neutral"
            }
          />
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Level" value={`${Math.round(level$.get() * 100)}%`} />
          <StatCard label="Charging" value={charging$.get() ? "Yes" : "No"} />
          <StatCard label="Charge Time" value={`${chargingTime$.get()}s`} />
          <StatCard label="Discharge Time" value={`${dischargingTime$.get()}s`} />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
