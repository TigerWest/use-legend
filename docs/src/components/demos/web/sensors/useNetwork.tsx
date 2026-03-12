"use client";
import { Show } from "@legendapp/state/react";
import { useNetwork } from "@usels/web";
import { DemoShell, DemoPanel, StatCard, StatusBadge, demoClasses } from "../../_shared";

export default function UseNetworkDemo() {
  const { isOnline$, isSupported$, downlink$, effectiveType$, rtt$, saveData$ } = useNetwork();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Network Status"
        description="Real-time network connection information."
        aside={
          <StatusBadge
            label={isOnline$.get() ? "Online" : "Offline"}
            tone={isOnline$.get() ? "green" : "orange"}
          />
        }
      >
        <Show if={isSupported$}>
          <div className={demoClasses.statsGrid}>
            <StatCard label="Effective Type" value={effectiveType$.get() ?? "—"} />
            <StatCard label="Downlink" value={`${downlink$.get() ?? "—"} Mbps`} />
            <StatCard label="RTT" value={`${rtt$.get() ?? "—"} ms`} />
            <StatCard label="Save Data" value={saveData$.get() ? "Yes" : "No"} />
          </div>
        </Show>
        <Show if={() => !isSupported$.get()}>
          <p
            style={{
              margin: 0,
              opacity: 0.6,
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            Network Information API is not supported in this browser.
          </p>
        </Show>
      </DemoPanel>
    </DemoShell>
  );
}
