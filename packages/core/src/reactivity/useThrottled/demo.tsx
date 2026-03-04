import { useObservable } from "@legendapp/state/react";
import { useThrottled } from ".";

export default function UseThrottledDemo() {
  const source$ = useObservable("");
  const throttled$ = useThrottled(source$, 500);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input
        type="text"
        placeholder="Type something..."
        value={source$.get()}
        onChange={(e) => source$.set(e.target.value)}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
      />
      <div style={{ padding: "10px 14px", borderRadius: "6px" }}>
        <div>Source: {source$.get()}</div>
        <div>Throttled (500ms): {throttled$.get()}</div>
      </div>
    </div>
  );
}
