import { ObservableHint, useObservable, type OpaqueObject } from "@usels/core";
import { useEventListener, useParentElement } from "@usels/web";
import { DemoPanel, DemoShell } from "../../_shared";

const OFFSET_Y = 0;

function overlayStyle(rect: DOMRect | null, color: string): React.CSSProperties {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- demo: type cast needed for observable wrapping
  const parent$ = useParentElement(element$ as any);

  useEventListener(
    "mousemove",
    (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      element$.set(el ? ObservableHint.opaque(el) : null);
    },
    { passive: true }
  );

  useEventListener(
    "scroll",
    () => {
      const el = element$.peek();
      element$.set(null);
      element$.set(el);
    },
    { passive: true, capture: true }
  );

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Parent Element"
        description="Move your mouse over the page to highlight elements."
      >
        <div className="flex gap-6 font-mono text-[13px]">
          <span>
            current:{" "}
            <strong style={{ color: "#a5a5a5" }}>
              {element$.get() ? `<${element$.get()?.tagName.toLowerCase()}>` : "—"}
            </strong>
          </span>
          <span>
            parent:{" "}
            <strong style={{ color: "#3eaf7c" }}>
              {parent$.get() ? `<${parent$.get()?.tagName.toLowerCase()}>` : "—"}
            </strong>
          </span>
        </div>
        <div style={overlayStyle(element$.get()?.getBoundingClientRect() ?? null, "#a5a5a528")} />
        <div style={overlayStyle(parent$.get()?.getBoundingClientRect() ?? null, "#3eaf7c28")} />
      </DemoPanel>
    </DemoShell>
  );
}
