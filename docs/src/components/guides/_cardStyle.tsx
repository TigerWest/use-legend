export function cardStyle(accent: string) {
  return {
    border: `1px solid ${accent}`,
    margin: 0,
    borderRadius: "10px",
    padding: "14px",
    background: "var(--sl-color-bg, #fff)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    minWidth: 240,
  };
}
