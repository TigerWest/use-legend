import { useRef$ } from "@usels/core";
import { useAnimate } from "@usels/web";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatCard,
  StatusBadge,
  demoClasses,
} from "../../_shared";
import { useObservable } from "@legendapp/state/react";

export default function Demo() {
  const el$ = useRef$<HTMLDivElement>();
  const {
    play,
    pause,
    reverse,
    finish,
    cancel,
    playState$,
    currentTime$,
    playbackRate$,
    pending$,
  } = useAnimate(
    el$,
    [
      { clipPath: "circle(20% at 0% 30%)" },
      { clipPath: "circle(20% at 50% 80%)" },
      { clipPath: "circle(20% at 100% 30%)" },
    ],
    {
      duration: 3000,
      iterations: 5,
      direction: "alternate",
      easing: "cubic-bezier(0.46, 0.03, 0.52, 0.96)",
    }
  );

  const isRunning$ = useObservable(() => playState$.get() === "running");

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Web Animations API"
        description="Reactive wrapper around element.animate() with play / pause / reverse controls."
        aside={
          <StatusBadge
            label={playState$.get() ?? "idle"}
            tone={isRunning$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="relative h-30 w-full overflow-hidden rounded-2xl border border-(--sl-color-hairline-light) bg-(--sl-color-gray-6)">
          <div
            ref={el$}
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, var(--sl-color-accent), var(--sl-color-blue, #3b82f6))",
            }}
          />
        </div>

        <div className={demoClasses.statsGrid}>
          <StatCard label="playState" value={playState$.get() ?? "—"} tone="accent" />
          <StatCard
            label="currentTime"
            value={currentTime$.get() != null ? `${Number(currentTime$.get()).toFixed(0)}ms` : "—"}
            tone="accent"
          />
          <StatCard label="playbackRate" value={`${playbackRate$.get()}x`} tone="accent" />
          <StatCard
            label="pending"
            value={String(pending$.get())}
            tone={pending$.get() ? "orange" : "neutral"}
          />
        </div>

        <div className={demoClasses.actionRow}>
          <ActionButton
            onClick={isRunning$.get() ? pause : play}
            tone={isRunning$.get() ? "orange" : "green"}
          >
            {isRunning$.get() ? "Pause" : "Play"}
          </ActionButton>
          <ActionButton onClick={reverse} tone="neutral">
            Reverse
          </ActionButton>
          <ActionButton onClick={finish} tone="neutral">
            Finish
          </ActionButton>
          <ActionButton onClick={cancel} tone="neutral">
            Cancel
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
