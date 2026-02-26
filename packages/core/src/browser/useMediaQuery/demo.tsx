import { useMediaQuery } from ".";
import { Computed } from "@legendapp/state/react";

const row: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "start",
  gap: "10px",
  padding: "8px 14px",
  borderRadius: "6px",
  border: "1px solid var(--sl-color-gray-5, #e2e8f0)",
  background: "var(--sl-color-gray-6, #f8fafc)",
  margin: 0,
};

const label: React.CSSProperties = {
  color: "var(--sl-color-gray-3, #64748b)",
  fontSize: "12px",
};

const value: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  fontWeight: "bold",
  color: "var(--sl-color-text, #0f172a)",
};

export default function UseMediaQueryDemo() {
  const isLargeScreen$ = useMediaQuery("(min-width: 1024px)");
  const prefersDark$ = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      <Computed>
        {() => (
          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <div style={row}>
              <span style={label}>isLargeScreen</span>
              <span style={value}>{String(isLargeScreen$.get())}</span>
            </div>
            <div style={row}>
              <span style={label}>prefersDark</span>
              <span style={value}>{String(prefersDark$.get())}</span>
            </div>
          </div>
        )}
      </Computed>
    </div>
  );
}
