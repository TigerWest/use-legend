import { useRef$ } from "../useRef$";
import { useMutationObserver } from ".";
import { Computed, useObservable } from "@legendapp/state/react";
import { batch, beginBatch, endBatch } from "@legendapp/state";

const MAX_LOG = 6;

const btn: React.CSSProperties = {
  height: "26px",
  padding: "0 10px",
  fontSize: "12px",
  cursor: "pointer",
  borderRadius: "4px",
  border: "1px solid var(--sl-color-gray-4, #94a3b8)",
  background: "transparent",
  fontFamily: "monospace",
  display: "inline-flex",
  alignItems: "center",
  margin: 0,
};

const rowLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--sl-color-gray-3, #94a3b8)",
  alignSelf: "center",
  userSelect: "none",
  minWidth: "52px",
};

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
        return `[childList]   ${[a && `+${a} added`, rm && `-${rm} removed`]
          .filter(Boolean)
          .join(", ")}`;
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
      "color:var(--sl-color-gray-2,#475569);padding:1px 0";
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          padding: "6px 12px",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          borderRadius: "6px",
        }}
      >
        <Computed>
          {() => (
            <span>
              status:{" "}
              <strong
                style={{
                  color: stopped$.get()
                    ? "var(--sl-color-red, #ef4444)"
                    : "var(--sl-color-green, #22c55e)",
                }}
              >
                {stopped$.get() ? "stopped" : "observing"}
              </strong>
            </span>
          )}
        </Computed>
        <Computed>
          {() => (
            <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>
              data-active: <strong>{active$.get() ? '"true"' : "—"}</strong>
            </span>
          )}
        </Computed>
        <Computed>
          {() => (
            <span style={{ color: "var(--sl-color-gray-3, #94a3b8)" }}>
              children: <strong>{childCount$.get()}</strong>
            </span>
          )}
        </Computed>
      </div>

      {/* DOM mutation actions */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <span style={rowLabel}>DOM</span>
        <button onClick={toggleAttr} style={btn}>
          toggle data-active
        </button>
        <button onClick={addChild} style={btn}>
          add child
        </button>
        <button onClick={removeChild} style={btn}>
          remove child
        </button>
        <button onClick={() => log$.set([])} style={btn}>
          clear log
        </button>
      </div>

      {/* Observer control */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <span style={rowLabel}>Observer</span>
        <Computed>
          {() =>
            stopped$.get() ? (
              <button
                onClick={() => {
                  resume();
                  stopped$.set(false);
                }}
                style={{
                  ...btn,
                  borderColor: "var(--sl-color-green, #22c55e)",
                  color: "var(--sl-color-green, #22c55e)",
                }}
              >
                resume observe()
              </button>
            ) : (
              <button
                onClick={() => {
                  stop();
                  stopped$.set(true);
                }}
                style={{
                  ...btn,
                  borderColor: "var(--sl-color-red, #ef4444)",
                  color: "var(--sl-color-red, #ef4444)",
                }}
              >
                stop observe()
              </button>
            )
          }
        </Computed>
      </div>

      {/* Observed target element — children appended/removed by buttons above */}
      <Computed>
        {() => (
          <div
            ref={el$}
            style={{
              minHeight: "52px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: `1px dashed ${
                active$.get() ? "var(--sl-color-green, #22c55e)" : "var(--sl-color-gray-4, #94a3b8)"
              }`,
              background: active$.get() ? "var(--sl-color-green-low, #f0fdf4)" : "transparent",
              transition: "border-color 0.2s, background 0.2s",
            }}
          />
        )}
      </Computed>

      {/* Mutation log */}
      <div
        style={{
          minHeight: "80px",
          maxHeight: "168px",
          overflowY: "auto",
          padding: "8px 12px",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        <Computed>
          {() => {
            const entries = log$.get();
            if (!entries.length) {
              return <span style={{ opacity: 0.4 }}>— no mutations recorded yet</span>;
            }
            return (
              <>
                {entries.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "1px 0",
                      opacity: Math.max(0.2, 1 - i * 0.15),
                    }}
                  >
                    {line}
                  </div>
                ))}
              </>
            );
          }}
        </Computed>
      </div>
    </div>
  );
}
