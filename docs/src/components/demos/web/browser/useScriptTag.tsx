import { useScriptTag } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

export default function UseScriptTagDemo() {
  const { isLoaded$, load, unload } = useScriptTag(
    "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js",
    () => {},
    { manual: true, crossOrigin: "anonymous" }
  );

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="useScriptTag"
        description="Dynamically load and unload an external script tag."
        aside={
          <StatusBadge
            label={isLoaded$.get() ? "Loaded" : "Not loaded"}
            tone={isLoaded$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className={demoClasses.valueRow}>
          <span className={demoClasses.settingLabel}>src</span>
          <code style={{ fontSize: "11px", wordBreak: "break-all" }}>
            cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
          </code>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => load()} tone="accent" grow>
            Load
          </ActionButton>
          <ActionButton onClick={() => unload()} tone="neutral" grow>
            Unload
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
