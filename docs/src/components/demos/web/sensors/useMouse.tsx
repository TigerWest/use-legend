"use client";
import { useState } from "react";
import { useMouse, useRef$, type UseMouseCoordType } from "@usels/web";
import { DemoShell, DemoPanel, StatCard, StatusBadge, demoClasses } from "../../_shared";

function MouseTracker({ type }: { type: UseMouseCoordType }) {
  const target$ = useRef$();
  const { x$, y$, sourceType$ } = useMouse({ type, target: target$ });

  return (
    <>
      <div
        className={demoClasses.statsGrid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}
      >
        <StatCard label="X" value={`${Math.round(x$.get())}px`} tone="accent" />
        <StatCard label="Y" value={`${Math.round(y$.get())}px`} tone="accent" />
      </div>
      <div className={demoClasses.valueRow}>
        <StatusBadge
          label={`Source: ${sourceType$.get() ?? "none"}`}
          tone={
            sourceType$.get() === "mouse"
              ? "green"
              : sourceType$.get() === "touch"
                ? "orange"
                : "neutral"
          }
        />
      </div>
      <div
        ref={target$}
        style={{
          position: "relative",
          width: "100%",
          height: "140px",
          borderRadius: "12px",
          border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: "crosshair",
          userSelect: "none",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        move your mouse here
      </div>
    </>
  );
}

export default function UseMouseDemo() {
  const [type, setType] = useState<UseMouseCoordType>("page");

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel title="useMouse" description="Track mouse cursor position in real-time.">
        <div className={demoClasses.settingRow}>
          <div className={demoClasses.settingField}>
            <span className={demoClasses.settingLabel}>Coordinate Type</span>
            <select
              className={demoClasses.input}
              value={type}
              onChange={(e) => setType(e.target.value as UseMouseCoordType)}
              style={{ width: "auto" }}
            >
              <option value="page">page</option>
              <option value="client">client</option>
              <option value="screen">screen</option>
              <option value="movement">movement</option>
            </select>
          </div>
        </div>
        <MouseTracker key={type} type={type} />
      </DemoPanel>
    </DemoShell>
  );
}
