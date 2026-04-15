import { useObservable, useRef$ } from "@usels/core";
import { useResizeObserver } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, demoClasses } from "../../_shared";

export default function UseResizeObserverDemo() {
  const el$ = useRef$<HTMLTextAreaElement>();
  const size$ = useObservable({ width: 0, height: 0 });

  useResizeObserver(el$, (entries) => {
    const { width, height } = entries[0].contentRect;
    size$.assign({ width: Math.round(width), height: Math.round(height) });
  });

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Resize Observer"
        description="Resize the textarea to see width & height update."
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="width" value={`${size$.width.get()}px`} />
          <StatCard label="height" value={`${size$.height.get()}px`} />
        </div>
        <textarea
          ref={el$}
          defaultValue="resize this textarea"
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
