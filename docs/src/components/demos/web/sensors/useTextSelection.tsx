import { useTextSelection } from "@usels/web";
import { DemoPanel, DemoShell, StatCard } from "../../_shared";

export default function Demo() {
  const { text$, rects$, ranges$ } = useTextSelection();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Text Selection"
        description="Select any text on this page to see the selection details update in real time."
      >
        <p className="mb-4 text-[14px] leading-relaxed text-[var(--sl-color-text)]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae
          vestibulum vestibulum. Cras porttitor metus justo, ut fringilla enim fermentum sed.
        </p>
        <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          <StatCard label="Text" value={text$.get() || "—"} tone="accent" />
          <StatCard label="Ranges" value={String(ranges$.get().length)} tone="neutral" />
          <StatCard label="Rects" value={String(rects$.get().length)} tone="neutral" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
