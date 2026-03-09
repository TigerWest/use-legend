import { useObservable } from "@legendapp/state/react";
import { useThrottleFn } from "@usels/core";

export default function UseThrottleFnDemo() {
  const clickCount$ = useObservable(0);
  const throttledCount$ = useObservable(0);

  const throttledIncrement = useThrottleFn(() => {
    throttledCount$.set((c) => c + 1);
  }, 1000);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        type="button"
        onClick={() => {
          clickCount$.set((c) => c + 1);
          throttledIncrement();
        }}
        style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc" }}
      >
        Click me rapidly!
      </button>
      <div style={{ padding: "10px 14px", borderRadius: "6px" }}>
        <div>Clicks: {clickCount$.get()}</div>
        <div>Throttled: {throttledCount$.get()}</div>
      </div>
    </div>
  );
}
