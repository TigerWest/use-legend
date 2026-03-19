import { useDisplayMedia } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, stream$, enabled$, start, stop } = useDisplayMedia();

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Display Media"
        description="Share your screen via getDisplayMedia. Click Start to begin sharing."
        aside={
          <StatusBadge
            label={
              !isSupported$.get()
                ? "Not Supported"
                : enabled$.get()
                  ? "Sharing"
                  : "Stopped"
            }
            tone={
              !isSupported$.get()
                ? "orange"
                : enabled$.get()
                  ? "green"
                  : "neutral"
            }
          />
        }
      >
        <div className="grid aspect-video w-full place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-black">
          {stream$.get() ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el) el.srcObject = stream$.get();
              }}
              className="h-full w-full rounded-2xl object-contain"
            />
          ) : (
            <span className="text-[14px] text-white/50">No screen shared</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={() => start()} tone="accent" grow>
            Start Sharing
          </ActionButton>
          <ActionButton onClick={() => stop()} tone="neutral" grow>
            Stop
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
