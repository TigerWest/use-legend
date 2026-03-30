import { useRef$ } from "@usels/core";
import { useParallax } from "@usels/web";
import { DemoPanel, DemoShell, StatCard, StatusBadge } from "../../_shared";

export default function Demo() {
  const el$ = useRef$<HTMLDivElement>();
  const { roll$, tilt$, source$ } = useParallax(el$);

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Parallax"
        description="Move your mouse over the card to see the parallax effect. On mobile, device orientation is used instead."
        aside={
          <StatusBadge
            label={source$.get() === "deviceOrientation" ? "Gyroscope" : "Mouse"}
            tone={source$.get() === "deviceOrientation" ? "green" : "accent"}
          />
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div
            ref={el$}
            style={{
              transform: `perspective(600px) rotateX(${roll$.get() * 20}deg) rotateY(${tilt$.get() * 20}deg)`,
              transition: "transform 0.05s ease-out",
              willChange: "transform",
            }}
            className="flex h-28 w-full cursor-crosshair items-center justify-center rounded-2xl border border-[var(--sl-color-accent)] bg-[var(--sl-color-accent-low)] select-none"
          >
            <span className="text-[13px] font-bold text-[var(--sl-color-accent-high)]">
              Hover me
            </span>
          </div>

          <div className="grid w-full gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
            <StatCard label="Tilt (Y)" value={tilt$.get().toFixed(3)} tone="accent" />
            <StatCard label="Roll (X)" value={roll$.get().toFixed(3)} tone="accent" />
            <StatCard label="Source" value={source$.get()} tone="neutral" />
          </div>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
