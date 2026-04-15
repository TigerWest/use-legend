import { Show, useRef$ } from "@usels/core";
import { useDropZone } from "@usels/web";
import { DemoPanel, DemoShell } from "../../_shared";

export default function Demo() {
  const el$ = useRef$<HTMLDivElement>();

  const { files$, isOverDropZone$ } = useDropZone(el$, {
    dataTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
    multiple: true,
  });

  return (
    <DemoShell eyebrow="Elements">
      <DemoPanel
        title="Drop Zone"
        description="Drag image files (PNG, JPEG, GIF, WebP) into the zone below."
      >
        <div
          ref={el$}
          style={{
            height: 160,
            border: `2px dashed ${isOverDropZone$.get() ? "var(--sl-color-accent)" : "var(--sl-color-hairline-light)"}`,
            borderRadius: 12,
            background: isOverDropZone$.get()
              ? "var(--sl-color-accent-low)"
              : "var(--sl-color-gray-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isOverDropZone$.get() ? "var(--sl-color-accent-high)" : "var(--sl-color-gray-3)",
            transition: "all 0.15s",
          }}
        >
          {isOverDropZone$.get() ? "Drop to upload" : "Drag image files here"}
        </div>
        <Show if={files$}>
          <ul className="m-0 list-none p-0 font-mono text-[13px] text-(--sl-color-text)">
            {files$.get()?.map((f, i) => (
              <li key={i}>
                📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </Show>
      </DemoPanel>
    </DemoShell>
  );
}
