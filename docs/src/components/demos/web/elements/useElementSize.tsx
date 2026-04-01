import { useRef$ } from "@usels/core";
import { useElementSize } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

export default function UseElementSizeDemo() {
  const el$ = useRef$<HTMLTextAreaElement>();
  const { width$, height$ } = useElementSize(el$);

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Element Size"
        description="Resize the textarea to see width & height update."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="width" value={`${Math.round(width$.get())}px`} />
          <StatCard label="height" value={`${Math.round(height$.get())}px`} />
        </div>
        <textarea
          ref={el$}
          defaultValue="Resize this textarea to see width & height update"
          style={{
            resize: "both",
            overflow: "auto",
            width: "300px",
            height: "120px",
            padding: "10px",
            border: "1px solid var(--sl-color-hairline-light)",
            borderRadius: "6px",
            fontFamily: "inherit",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        />
      </DemoPanel>
    </DemoShell>
  );
}
