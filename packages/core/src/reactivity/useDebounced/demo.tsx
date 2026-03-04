import { useObservable } from "@legendapp/state/react";
import { useDebounced } from ".";

export default function UseDebouncedDemo() {
  const source$ = useObservable("");
  const debounced$ = useDebounced(source$, 500, { maxWait: 1000 });

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
        <div>Debounced (500ms): {debounced$.get()}</div>
      </div>
    </div>
  );
}
