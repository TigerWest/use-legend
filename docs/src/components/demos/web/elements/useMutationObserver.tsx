import { batch, beginBatch, endBatch } from "@legendapp/state";
import { Show, useObservable } from "@legendapp/state/react";
import { useRef$ } from "@usels/core";
import { useMutationObserver } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../_shared";

const MAX_LOG = 6;

export default function UseMutationObserverDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const log$ = useObservable<string[]>([]);
  const active$ = useObservable(false);
  const childCount$ = useObservable(0);
  const stopped$ = useObservable(false);

  const { stop, resume } = useMutationObserver(
    el$,
    (records) => {
      const lines = records.map((r): string => {
        if (r.type === "attributes") {
          return `[attributes]  ${r.attributeName}  ← was: ${r.oldValue ?? "—"}`;
        }
        const a = r.addedNodes.length;
        const rm = r.removedNodes.length;
        return `[childList]   ${[a && `+${a} added`, rm && `-${rm} removed`].filter(Boolean).join(", ")}`;
      });
      batch(() => {
        log$.unshift(...lines);
        if (MAX_LOG < log$.peek().length) {
          log$.splice(-1, 1);
        }
      });
    },
    { attributes: true, attributeOldValue: true, childList: true }
  );

  const toggleAttr = () => {
    batch(() => {
      const el = el$.peek();
      if (!el) return;
      const next = !active$.peek();
      active$.set(next);
      if (next) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    });
  };

  const addChild = () => {
    const el = el$.peek();
    if (!el) return;
    beginBatch();
    childCount$.set((n) => n + 1);
    const span = document.createElement("span");
    span.textContent = `child-${childCount$.peek()}`;
    span.style.cssText =
      "display:block;font-size:12px;font-family:monospace;" +
      "color:var(--sl-color-gray-2);padding:1px 0";
    el.appendChild(span);
    endBatch();
  };

  const removeChild = () => {
    const el = el$.peek();
    if (!el) return;
    const last = el.querySelector("span:last-of-type");
    if (!last) return;
    el.removeChild(last);
    childCount$.set((n) => Math.max(0, n - 1));
  };

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Mutation Observer"
        aside={
          <StatusBadge
            label={stopped$.get() ? "stopped" : "observing"}
            tone={stopped$.get() ? "orange" : "green"}
          />
        }
      >
        <div className="flex flex-wrap gap-4 font-mono text-[12px] text-(--sl-color-gray-2)">
          <span>
            data-active: <strong>{active$.get() ? '"true"' : "—"}</strong>
          </span>
          <span>
            children: <strong>{childCount$.get()}</strong>
          </span>
        </div>
        <div className={demoClasses.actionRow}>
          <ActionButton onClick={toggleAttr} tone="neutral">
            toggle data-active
          </ActionButton>
          <ActionButton onClick={addChild} tone="neutral">
            add child
          </ActionButton>
          <ActionButton onClick={removeChild} tone="neutral">
            remove child
          </ActionButton>
          <ActionButton onClick={() => log$.set([])} tone="neutral">
            clear log
          </ActionButton>
          <Show
            if={stopped$}
            else={
              <ActionButton
                onClick={() => {
                  stop();
                  stopped$.set(true);
                }}
                tone="orange"
              >
                stop observe()
              </ActionButton>
            }
          >
            <ActionButton
              onClick={() => {
                resume();
                stopped$.set(false);
              }}
              tone="accent"
            >
              resume observe()
            </ActionButton>
          </Show>
        </div>
        <div
          ref={el$}
          style={{
            minHeight: "52px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: `1px dashed ${active$.get() ? "var(--sl-color-green)" : "var(--sl-color-hairline-light)"}`,
            background: active$.get() ? "var(--sl-color-green-low)" : "transparent",
            transition: "border-color 0.2s, background 0.2s",
          }}
        />
        <div
          style={{
            minHeight: "80px",
            maxHeight: "168px",
            overflowY: "auto",
            padding: "8px 12px",
            background: "var(--sl-color-gray-6)",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          {log$.get().length === 0 ? (
            <span style={{ opacity: 0.4 }}>— no mutations recorded yet</span>
          ) : (
            log$.get().map((line, i) => (
              <div key={i} style={{ padding: "1px 0", opacity: Math.max(0.2, 1 - i * 0.15) }}>
                {line}
              </div>
            ))
          )}
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
