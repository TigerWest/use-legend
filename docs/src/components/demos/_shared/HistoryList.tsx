import { For, Memo, Show, type Observable, type ReadonlyObservable } from "@usels/core";
import type { ReactNode } from "react";
import { cx, DemoPanel, toneClasses } from ".";

type HistoryRecordLike = {
  readonly snapshot: unknown;
  readonly timestamp: number;
};

type HistoryListProps = {
  readonly title: string;
  readonly emptyText: string;
  readonly history$: ReadonlyObservable<HistoryRecordLike[]>;
  readonly tone?: "accent" | "green" | "orange" | "neutral";
  readonly renderSnapshot?: (record$: Observable<HistoryRecordLike>) => ReactNode;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function HistoryList({
  title,
  emptyText,
  history$,
  tone = "accent",
  renderSnapshot,
}: HistoryListProps) {
  return (
    <DemoPanel title={title} description="Newest snapshot is pinned at the top.">
      <Show
        if={() => history$.get().length > 0}
        else={
          <div className="rounded-[14px] border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-4 py-4 text-center text-[13px] text-[var(--sl-color-gray-3)]">
            {emptyText}
          </div>
        }
      >
        <div className="flex max-h-[240px] flex-col gap-2.5 overflow-y-auto">
          <For each={history$ as unknown as Observable<HistoryRecordLike[]>} optimized>
            {(record$, id) => {
              const active = id === "0";

              return (
                <div
                  className={cx(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[14px] border px-3 py-2.5",
                    active
                      ? toneClasses[tone].surface
                      : "border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)]"
                  )}
                >
                  <div
                    className={cx(
                      "min-w-[40px] rounded-full border px-2 py-1 text-center text-[11px] font-bold",
                      active
                        ? "border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)]"
                        : "border-[var(--sl-color-hairline-light)] text-[var(--sl-color-gray-3)]"
                    )}
                  >
                    {active ? "Now" : `#${Number(id) + 1}`}
                  </div>
                  <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-[var(--sl-color-text)]">
                    <Memo>
                      {() =>
                        renderSnapshot ? renderSnapshot(record$) : String(record$.snapshot.get())
                      }
                    </Memo>
                  </div>
                  <Memo>
                    {() => (
                      <time
                        className="text-[11px] text-[var(--sl-color-gray-3)] [font-variant-numeric:tabular-nums]"
                        dateTime={new Date(record$.timestamp.get()).toISOString()}
                        suppressHydrationWarning
                      >
                        {timeFormatter.format(record$.timestamp.get())}
                      </time>
                    )}
                  </Memo>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </DemoPanel>
  );
}
