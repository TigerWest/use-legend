import { useUserMedia } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, stream$, enabled$, start, stop } = useUserMedia({
    constraints: { audio: true, video: true },
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="User Media"
        description="Access the camera via getUserMedia. Click Start to begin streaming."
        aside={
          <StatusBadge
            label={!isSupported$.get() ? "Not Supported" : enabled$.get() ? "Streaming" : "Stopped"}
            tone={!isSupported$.get() ? "orange" : enabled$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--sl-color-hairline-light)] bg-black grid place-items-center">
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
            <span className="text-[14px] text-white/50">No stream</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <ActionButton onClick={() => start()} tone="accent" grow>
            Start
          </ActionButton>
          <ActionButton onClick={() => stop()} tone="neutral" grow>
            Stop
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
