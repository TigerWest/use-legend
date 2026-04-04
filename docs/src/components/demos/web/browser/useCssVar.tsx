import { useCssVar, useRef$ } from "@usels/web";
import { ActionButton, DemoPanel, DemoShell, StatCard, ValueToken } from "../../_shared";
import { useObservable } from "@legendapp/state/react";

const COLORS = ["#7fa998", "#df8543", "#6366f1", "#e11d48", "#0ea5e9"];

export default function Demo() {
  const el$ = useRef$<HTMLDivElement>();
  const color$ = useCssVar("--demo-bg", el$, { initialValue: COLORS[0]! });

  const currentColor$ = useObservable(() => color$.get() || COLORS[0]!);
  const nextIndex$ = useObservable(() => (COLORS.indexOf(currentColor$.get()) + 1) % COLORS.length);

  return (
    <DemoShell eyebrow="Browser">
      <DemoPanel
        title="useCssVar"
        description="Reactively read and write CSS custom properties on DOM elements."
      >
        <div className="flex flex-col gap-3">
          <div
            ref={el$}
            style={{ "--demo-bg": currentColor$.get() } as React.CSSProperties}
            className="flex h-20 items-center justify-center rounded-2xl text-white font-bold text-sm transition-colors"
            // inline style as fallback for jsdom; CSS var drives background in real browser
          >
            <span style={{ background: currentColor$.get() }} className="rounded-xl px-3 py-1.5">
              {currentColor$.get()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <StatCard label="CSS Variable" value={<ValueToken>--demo-bg</ValueToken>} />
            <StatCard
              label="Value"
              value={<ValueToken>{currentColor$.get()}</ValueToken>}
              tone="accent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <ActionButton
                key={c}
                onClick={() => color$.set(c)}
                tone={c === currentColor$.get() ? "accent" : "neutral"}
              >
                <span
                  style={{ background: c }}
                  className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle"
                />
                {c}
              </ActionButton>
            ))}
          </div>

          <ActionButton onClick={() => color$.set(COLORS[nextIndex$.get()]!)} tone="accent">
            Next Color
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
