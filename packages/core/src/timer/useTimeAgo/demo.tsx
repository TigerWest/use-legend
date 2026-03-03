import { useObservable } from "@legendapp/state/react";
import { useTimeAgo } from ".";

const INITIAL_TIME = Date.now();

export default function UseTimeAgoDemo() {
  const slider$ = useObservable(0);
  const targetTime$ = useObservable(INITIAL_TIME);

  const timeAgo$ = useTimeAgo(targetTime$);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    slider$.set(val);
    targetTime$.set(Date.now() + val ** 3);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          textAlign: "center",
        }}
      >
        <strong style={{ fontSize: "18px", color: "var(--sl-color-white, #1e293b)" }}>
          {timeAgo$.get()}
        </strong>
      </div>
      <input
        type="range"
        min={-3800}
        max={3800}
        value={slider$.get()}
        onChange={handleChange}
        style={{ width: "100%" }}
      />
      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "var(--sl-color-gray-3, #94a3b8)",
        }}
      >
        {slider$.get() ** 3}ms
      </div>
    </div>
  );
}
