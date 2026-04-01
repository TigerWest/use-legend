import { useWindowFocus } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function UseWindowFocusDemo() {
  const focused$ = useWindowFocus();

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Window Focus"
        description="Click outside this window or switch tabs to see the value change."
        aside={
          <StatusBadge
            label={focused$.get() ? "focused" : "blurred"}
            tone={focused$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="font-mono text-[13px] text-(--sl-color-gray-2)">
          focused$.get() ={" "}
          <strong className={focused$.get() ? "text-(--sl-color-green)" : ""}>
            {String(focused$.get())}
          </strong>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
