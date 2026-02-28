import { useRef$ } from "../useRef$";
import { useElementSize } from ".";

export default function UseElementSizeDemo() {
  const el$ = useRef$<HTMLTextAreaElement>();
  const { width$, height$ } = useElementSize(el$);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          gap: "24px",
          fontFamily: "monospace",
          fontSize: "14px",
          padding: "8px 12px",
          background: "var(--sl-color-gray-6, #f1f5f9)",
          borderRadius: "6px",
        }}
      >
        <>
          <span>
            width: <strong>{Math.round(width$.get())}px</strong>
          </span>
          <span>
            height: <strong>{Math.round(height$.get())}px</strong>
          </span>
        </>
      </div>
      <textarea
        ref={el$}
        defaultValue="Resize this textarea to see width & height update"
        style={{
          resize: "both",
          overflow: "auto",
          width: "300px",
          height: "120px",
          padding: "10px",
          border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
          borderRadius: "6px",
          fontFamily: "inherit",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      />
    </div>
  );
}
