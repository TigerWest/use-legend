import { useDevicePixelRatio } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, pixelRatio$ } = useDevicePixelRatio();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Device Pixel Ratio"
        description="Reactively tracks window.devicePixelRatio. Try zooming in/out (Ctrl/Cmd + or -) to see it change."
        aside={
          <StatusBadge
            label={isSupported$.get() ? "Supported" : "Not Supported"}
            tone={isSupported$.get() ? "green" : "orange"}
          />
        }
      >
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Pixel Ratio" value={pixelRatio$.get()?.toFixed(2) ?? "—"} tone="accent" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
