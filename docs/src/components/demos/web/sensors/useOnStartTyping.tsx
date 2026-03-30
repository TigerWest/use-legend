import { useOnStartTyping } from "@usels/web";
import { useRef } from "react";
import { DemoPanel, DemoShell, demoClasses } from "../../_shared";

export default function Demo() {
  const inputRef = useRef<HTMLInputElement>(null);

  useOnStartTyping(() => {
    inputRef.current?.focus();
  });

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="On Start Typing"
        description="Click outside the input, then start typing. The input auto-focuses."
      >
        <input
          ref={inputRef}
          className={demoClasses.input}
          placeholder="Start typing anywhere to focus here..."
        />
      </DemoPanel>
    </DemoShell>
  );
}
