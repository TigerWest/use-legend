import { useRef$ } from "@usels/core";
import { useElementVisibility } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function UseElementVisibilityDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const isVisible$ = useElementVisibility(el$, { threshold: 0.5 });

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Element Visibility"
        description="Scroll down in the box — the target turns green when ≥50% is visible."
        aside={
          <StatusBadge
            label={isVisible$.get() ? "visible" : "hidden"}
            tone={isVisible$.get() ? "green" : "neutral"}
          />
        }
      >
        <div
          style={{
            height: "200px",
            overflowY: "auto",
            border: "1px solid var(--sl-color-hairline-light)",
            borderRadius: "6px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--sl-color-gray-3)",
              fontSize: "13px",
              fontFamily: "monospace",
            }}
          >
            ↓ scroll down
          </div>
          <div
            ref={el$}
            style={{
              margin: "0 16px",
              padding: "20px",
              borderRadius: "6px",
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: "13px",
              transition: "background 0.2s, border-color 0.2s",
              border: `2px solid ${isVisible$.get() ? "var(--sl-color-green)" : "var(--sl-color-gray-4)"}`,
              background: isVisible$.get() ? "var(--sl-color-green-low)" : "transparent",
            }}
          >
            target element
          </div>
          <div style={{ height: "140px" }} />
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
