import { useRef$ } from "@usels/core";
import { useElementHover } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function UseElementHoverDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const isHovered$ = useElementHover(el$);

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Element Hover"
        description="Hover over the box below to see the state change."
        aside={
          <StatusBadge
            label={isHovered$.get() ? "Hovered" : "Not Hovered"}
            tone={isHovered$.get() ? "green" : "neutral"}
          />
        }
      >
        <div
          ref={el$}
          className="grid h-32 place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] text-[14px] font-bold text-[var(--sl-color-text)] transition-colors"
          style={{
            backgroundColor: isHovered$.get() ? "var(--sl-color-accent-low)" : undefined,
          }}
        >
          {isHovered$.get() ? "Hovered!" : "Hover me"}
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
