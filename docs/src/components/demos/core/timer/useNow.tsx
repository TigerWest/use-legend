import { useObservable } from "@legendapp/state/react";
import { useNow } from "@usels/core";
import { DemoPanel, DemoShell, ValueToken } from "@demos/_shared";

export default function UseNowDemo() {
  const now$ = useNow();
  const nowLocale$ = useObservable(() => now$.get().toLocaleString());

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel title="Current Time" description="Updates every frame via requestAnimationFrame.">
        <ValueToken>
          <span suppressHydrationWarning>{nowLocale$.get()}</span>
        </ValueToken>
      </DemoPanel>
    </DemoShell>
  );
}
