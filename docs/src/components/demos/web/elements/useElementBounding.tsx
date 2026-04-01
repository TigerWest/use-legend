import { useRef$ } from "@usels/core";
import { useElementBounding } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

export default function UseElementBoundingDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const { x$, y$, top$, left$, width$, height$ } = useElementBounding(el$);

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Element Bounding"
        description="Resize the box below to see its bounding rect update."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="x" value={`${Math.round(x$.get())}px`} />
          <StatCard label="y" value={`${Math.round(y$.get())}px`} />
          <StatCard label="top" value={`${Math.round(top$.get())}px`} />
          <StatCard label="left" value={`${Math.round(left$.get())}px`} />
          <StatCard label="width" value={`${Math.round(width$.get())}px`} />
          <StatCard label="height" value={`${Math.round(height$.get())}px`} />
        </div>
        <div
          ref={el$}
          style={{
            resize: "both",
            overflow: "auto",
            width: "240px",
            height: "100px",
            padding: "12px",
            border: "1px solid var(--sl-color-hairline-light)",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--sl-color-gray-3)",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          resize me ↘
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
