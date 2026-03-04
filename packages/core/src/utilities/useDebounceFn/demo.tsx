import { useObservable } from "@legendapp/state/react";
import { useDebounceFn } from ".";

export default function UseDebounceFnDemo() {
  const input$ = useObservable("");
  const debounced$ = useObservable("");
  const callCount$ = useObservable(0);

  const debouncedUpdate = useDebounceFn((value: string) => {
    debounced$.set(value);
    callCount$.set((c) => c + 1);
  }, 500);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <input
        type="text"
        placeholder="Type something..."
        value={input$.get()}
        onChange={(e) => {
          input$.set(e.target.value);
          debouncedUpdate(e.target.value);
        }}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
      />
      <div style={{ padding: "10px 14px", borderRadius: "6px" }}>
        <div>Input: {input$.get()}</div>
        <div>Debounced: {debounced$.get()}</div>
        <div>Update count: {callCount$.get()}</div>
      </div>
    </div>
  );
}
