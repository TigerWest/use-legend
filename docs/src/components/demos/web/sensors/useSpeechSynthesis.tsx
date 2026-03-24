import { useSpeechSynthesis } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, isPlaying$, status$, toggle } = useSpeechSynthesis("Hello World", {
    lang: "en-GB",
    pitch: 1.2,
    rate: 0.9,
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Speech Synthesis"
        description="Text-to-speech via the SpeechSynthesis API. Click Speak to hear the text."
        aside={
          <StatusBadge
            label={
              !isSupported$.get()
                ? "Not Supported"
                : isPlaying$.get()
                  ? "Speaking"
                  : status$.get() === "end"
                    ? "Finished"
                    : "Ready"
            }
            tone={!isSupported$.get() ? "orange" : isPlaying$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="grid h-24 place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg-nav)]">
          <span className="text-[14px] text-[var(--sl-color-text-badge)]">
            Status: {status$.get()}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <ActionButton
            onClick={() => toggle()}
            tone={isPlaying$.get() ? "neutral" : "accent"}
            grow
          >
            {isPlaying$.get() ? "Stop" : "Speak"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
