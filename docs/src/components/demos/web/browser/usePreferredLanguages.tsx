"use client";
import { For } from "@legendapp/state/react";
import { useObservable } from "@legendapp/state/react";
import { usePreferredLanguages } from "@usels/web";
import { DemoShell, DemoPanel, ValueToken, demoClasses } from "../../_shared";

export default function UsePreferredLanguagesDemo() {
  const languages$ = usePreferredLanguages();
  const items$ = useObservable(() => [...languages$.get()]);

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="Preferred Languages"
        description="Tracks the user's preferred browser languages."
      >
        <div className={demoClasses.statsGrid}>
          <For each={items$}>
            {(lang$) => <ValueToken>{lang$.get()}</ValueToken>}
          </For>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
