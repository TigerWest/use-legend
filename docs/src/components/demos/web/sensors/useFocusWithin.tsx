import { useRef$ } from "@usels/core";
import { useFocusWithin } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

export default function UseFocusWithinDemo() {
  const form$ = useRef$<HTMLDivElement>();
  const { focused$ } = useFocusWithin(form$);

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Focus Within Container"
        description="Click on any input inside the container. The status shows whether any child has focus."
        aside={
          <StatusBadge
            label={focused$.get() ? "Focus Inside" : "No Focus"}
            tone={focused$.get() ? "green" : "neutral"}
          />
        }
      >
        <div
          ref={form$}
          className="flex flex-col gap-2 rounded-xl border p-3 transition-all"
          style={{
            borderColor: focused$.get()
              ? "var(--sl-color-accent)"
              : "var(--sl-color-hairline-light)",
            boxShadow: focused$.get()
              ? "0 0 0 3px var(--sl-color-accent-low)"
              : "none",
          }}
        >
          <input className={demoClasses.input} placeholder="Name" />
          <input className={demoClasses.input} placeholder="Email" />
          <input className={demoClasses.input} placeholder="Message" />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
