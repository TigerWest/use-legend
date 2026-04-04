import { useStyleTag } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

const DEFAULT_CSS = `.demo-box {
  padding: 1rem;
  border-radius: 8px;
  background: oklch(0.7 0.15 250);
  color: white;
  font-weight: bold;
  text-align: center;
}`;

export default function UseStyleTagDemo() {
  const { isLoaded$, css$, load, unload } = useStyleTag(DEFAULT_CSS, {
    id: "usels-style-tag-demo",
    manual: true,
  });

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="useStyleTag"
        description="Dynamically inject and remove CSS styles in document.head."
        aside={
          <StatusBadge
            label={isLoaded$.get() ? "Injected" : "Not injected"}
            tone={isLoaded$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="demo-box">Styled by injected CSS</div>
        <textarea
          className={demoClasses.input}
          rows={5}
          value={css$.get()}
          onChange={(e) => css$.set(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: "12px", resize: "vertical" }}
        />
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={() => load()} tone="accent" grow>
            Inject
          </ActionButton>
          <ActionButton onClick={() => unload()} tone="neutral" grow>
            Remove
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
