import { useRef$ } from "@usels/core";
import { useIntersectionObserver } from "@usels/web";
import { Show, useObservable } from "@legendapp/state/react";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

const DEFAULT_ROOT_MARGIN = 0;

export default function UseIntersectionObserverDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const containerRef$ = useRef$<HTMLElement>();
  const isVisible$ = useObservable(false);
  const rootMargin$ = useObservable(DEFAULT_ROOT_MARGIN);

  const marginString$ = useObservable(() => {
    const m = Number(rootMargin$.get());
    return `${isNaN(m) ? 0 : m}px`;
  });

  const { isActive$, pause, resume } = useIntersectionObserver(
    el$,
    (entries) => {
      isVisible$.set(entries[0]?.isIntersecting ?? false);
    },
    { threshold: 0.5, rootMargin: marginString$, root: containerRef$ }
  );

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Intersection Observer"
        aside={
          <StatusBadge
            label={isActive$.get() ? String(isVisible$.get()) : "paused"}
            tone={isActive$.get() ? (isVisible$.get() ? "green" : "neutral") : "orange"}
          />
        }
      >
        <div className={demoClasses.settingRow}>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel}>rootMargin (px)</label>
            <input
              type="number"
              value={rootMargin$.get()}
              onChange={(e) => rootMargin$.set(Number(e.target.value))}
              className={demoClasses.numberInput}
            />
          </div>
          <div className={demoClasses.actionRow}>
            <Show
              if={isActive$}
              else={
                <ActionButton onClick={resume} tone="accent">
                  resume
                </ActionButton>
              }
            >
              <ActionButton onClick={pause} tone="neutral">
                pause
              </ActionButton>
            </Show>
            <Show if={() => rootMargin$.get() !== DEFAULT_ROOT_MARGIN}>
              <ActionButton onClick={() => rootMargin$.set(DEFAULT_ROOT_MARGIN)} tone="neutral">
                reset
              </ActionButton>
            </Show>
          </div>
        </div>
        <div
          ref={containerRef$}
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
