import { useSpeechRecognition } from "@usels/web";
import { Show } from "@legendapp/state/react";
import { ActionButton, DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, isListening$, isFinal$, result$, toggle } = useSpeechRecognition({
    lang: "en-US",
    interimResults: true,
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Speech Recognition"
        description="Speech-to-text via the SpeechRecognition API. Click Start and speak into your microphone."
        aside={
          <StatusBadge
            label={
              !isSupported$.get() ? "Not Supported" : isListening$.get() ? "Listening" : "Stopped"
            }
            tone={!isSupported$.get() ? "orange" : isListening$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="grid min-h-24 place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg-nav)] px-4 py-4">
          <Show
            if={isSupported$}
            else={
              <span className="text-[14px] text-[var(--sl-color-text-badge)]">
                SpeechRecognition is not supported in this browser.
              </span>
            }
          >
            <Show
              if={() => result$.get() !== ""}
              else={
                <span className="text-[14px] text-[var(--sl-color-text-badge)]">
                  {isListening$.get() ? "Listening…" : "Press Start and speak"}
                </span>
              }
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-center text-[15px] text-[var(--sl-color-text)]">
                  {result$.get()}
                </span>
                <span className="text-[12px] text-[var(--sl-color-text-badge)]">
                  {isFinal$.get() ? "Final" : "Interim"}
                </span>
              </div>
            </Show>
          </Show>
        </div>
        <div className="mt-3 flex gap-2">
          <ActionButton
            onClick={() => toggle()}
            tone={isListening$.get() ? "neutral" : "accent"}
            grow
          >
            {isListening$.get() ? "Stop" : "Start"}
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
