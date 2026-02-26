import { ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { Computed, useObservable } from "@legendapp/state/react";
import { useEventListener } from "../../browser/useEventListener";
import { useParentElement } from ".";

// HARD CODE OFFSET
const OFFSET_Y = -15;

function overlayStyle(
  rect: DOMRect | null,
  color: string,
): React.CSSProperties {
  if (!rect || rect.width === 0) return { display: "none" };
  return {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 9999,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top + OFFSET_Y}px`,
    backgroundColor: color,
    outline: `1px solid ${color.replace("28", "99")}`,
    transition: "all 0.05s linear",
  };
}

export default function UseParentElementDemo() {
  const element$ = useObservable<OpaqueObject<Element> | null>(null);
  const parent$ = useParentElement(element$ as any);

  useEventListener(
    "mousemove",
    (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      element$.set(el ? ObservableHint.opaque(el) : null);
    },
    { passive: true },
  );

  useEventListener(
    "scroll",
    () => {
      const el = element$.peek();
      element$.set(null);
      element$.set(el);
    },
    { passive: true, capture: true },
  );

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "4px 0",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--sl-color-gray-3, #94a3b8)",
          fontSize: "12px",
        }}
      >
        Move your mouse over the page to highlight elements.
      </p>

      <Computed>
        {() => {
          const el = element$.get() as HTMLElement | null;
          const parent = parent$.get() as HTMLElement | null;
          return (
            <div style={{ display: "flex", gap: "24px" }}>
              <span>
                current:{" "}
                <strong style={{ color: "#a5a5a5" }}>
                  {el ? `<${el.tagName.toLowerCase()}>` : "—"}
                </strong>
              </span>
              <span>
                parent:{" "}
                <strong style={{ color: "#3eaf7c" }}>
                  {parent ? `<${parent.tagName.toLowerCase()}>` : "—"}
                </strong>
              </span>
            </div>
          );
        }}
      </Computed>

      <Computed>
        {() => {
          const el = element$.get() as HTMLElement | null;
          const parent = parent$.get() as HTMLElement | null;
          return (
            <>
              <div
                style={overlayStyle(
                  el?.getBoundingClientRect() ?? null,
                  "#a5a5a528",
                )}
              />
              <div
                style={overlayStyle(
                  parent?.getBoundingClientRect() ?? null,
                  "#3eaf7c28",
                )}
              />
            </>
          );
        }}
      </Computed>
    </div>
  );
}
