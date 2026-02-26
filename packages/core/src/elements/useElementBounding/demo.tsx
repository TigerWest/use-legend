import { Computed } from "@legendapp/state/react";
import { useEl$ } from "../useEl$";
import { useElementBounding } from ".";

export default function UseElementBoundingDemo() {
  const el$ = useEl$<HTMLDivElement>();
  const { x, y, top, left, width, height } = useElementBounding(el$);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Bounding values readout */}
      <Computed>
        {() => (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "6px",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "10px 14px",
              background: "var(--sl-color-gray-6, #f1f5f9)",
              borderRadius: "6px",
            }}
          >
            {(
              [
                ["x", x.get()],
                ["y", y.get()],
                ["top", top.get()],
                ["left", left.get()],
                ["width", width.get()],
                ["height", height.get()],
              ] as [string, number][]
            ).map(([label, val]) => (
              <span key={label}>
                {label}: <strong>{Math.round(val)}px</strong>
              </span>
            ))}
          </div>
        )}
      </Computed>

      {/* Resizable target element */}
      <div
        ref={el$}
        style={{
          resize: "both",
          overflow: "auto",
          width: "240px",
          height: "100px",
          padding: "12px",
          border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "var(--sl-color-gray-3, #94a3b8)",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        resize me ↘
      </div>
    </div>
  );
}
