import { useRef$ } from "@usels/core";
import { useFocus } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

export default function UseFocusDemo() {
  const input$ = useRef$<HTMLInputElement>();
  const { focused$ } = useFocus(input$);

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Focus Tracking"
        description="Click the input or use the buttons to control focus programmatically."
        aside={
          <StatusBadge
            label={focused$.get() ? "Focused" : "Blurred"}
            tone={focused$.get() ? "green" : "neutral"}
          />
        }
      >
        <input
          ref={input$}
          className={demoClasses.input}
          placeholder="Click to focus this input"
        />
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => focused$.set(true)} tone="accent" grow>
            Focus
          </ActionButton>
          <ActionButton onClick={() => focused$.set(false)} tone="neutral" grow>
            Blur
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
