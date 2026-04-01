import { useWindowSize } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

export default function UseWindowSizeDemo() {
  const { width: width$, height: height$ } = useWindowSize();

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Window Size"
        description="Resize the browser window to see the values update."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="width" value={`${width$.get()}px`} />
          <StatCard label="height" value={`${height$.get()}px`} />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
