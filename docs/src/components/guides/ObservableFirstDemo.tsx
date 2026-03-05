import { Memo, useObservable } from "@legendapp/state/react";
import { useIntervalFn } from "@usels/core";
import { useRef, useState } from "react";
import { cardStyle } from "./_cardStyle";

function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}

function StateDrivenCard() {
  const [count, setCount] = useState(1);
  const renderCount = useRenderCount();

  useIntervalFn(() => {
    setCount((v) => v + 1);
  }, 24);

  return (
    <div style={cardStyle("var(--sl-color-orange, #f59e0b)")}>
      <h5 style={{ margin: 0 }}>Normal</h5>
      <div style={{ fontSize: "14px", color: "var(--sl-color-text-accent, #111827)" }}>
        Renders: <strong>{renderCount}</strong> (state-based card)
      </div>
      <div style={{ fontSize: "18px", fontWeight: 700 }}>Count: {count}</div>
    </div>
  );
}

function ObservableDrivenCard() {
  const count$ = useObservable(1);
  const renderCount = useRenderCount();

  useIntervalFn(() => {
    count$.set((v) => v + 1);
  }, 24);

  return (
    <div style={cardStyle("var(--sl-color-green, #22c55e)")}>
      <h5 style={{ margin: 0 }}>Fine-grained</h5>
      <div style={{ fontSize: "14px", color: "var(--sl-color-text-accent, #111827)" }}>
        Renders: <strong>{renderCount}</strong> (observable-based card)
      </div>
      <div style={{ fontSize: "18px", fontWeight: 700 }}>Count: {count$.get()}</div>
    </div>
  );
}

export default function ObservableFirstDemo() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "12px",
      }}
    >
      <StateDrivenCard />
      <ObservableDrivenCard />
    </div>
  );
}
