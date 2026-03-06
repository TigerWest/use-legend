import type { Observable } from "@legendapp/state";
import { For, Memo, Show } from "@legendapp/state/react";
import type { ReactNode } from "react";
import type { ReadonlyObservable } from "../types";

type Tone = "accent" | "green" | "orange" | "neutral";

type DemoShellProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
};

type DemoPanelProps = {
  readonly title: string;
  readonly description?: string;
  readonly tone?: Tone;
  readonly aside?: ReactNode;
  readonly children: ReactNode;
};

type StatusBadgeProps = {
  readonly label: string;
  readonly tone?: Tone;
};

type StatCardProps = {
  readonly label: string;
  readonly value: ReactNode;
  readonly tone?: Tone;
};

type ActionButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly tone?: Tone;
  readonly grow?: boolean;
};

type ValueTokenProps = {
  readonly children: ReactNode;
};

type HistoryRecordLike = {
  readonly snapshot: unknown;
  readonly timestamp: number;
};

type HistoryListProps = {
  readonly title: string;
  readonly emptyText: string;
  readonly history$: ReadonlyObservable<HistoryRecordLike[]>;
  readonly tone?: Tone;
  readonly renderSnapshot?: (record$: Observable<HistoryRecordLike>) => ReactNode;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const toneClasses: Record<
  Tone,
  {
    readonly surface: string;
    readonly fill: string;
    readonly text: string;
  }
> = {
  accent: {
    surface:
      "border-[var(--sl-color-accent)] bg-[var(--sl-color-accent-low)] text-[var(--sl-color-accent-high)]",
    fill: "bg-[var(--sl-color-accent)]",
    text: "text-[var(--sl-color-accent-high)]",
  },
  green: {
    surface:
      "border-[var(--sl-color-green)] bg-[var(--sl-color-green-low)] text-[var(--sl-color-green)]",
    fill: "bg-[var(--sl-color-green)]",
    text: "text-[var(--sl-color-green)]",
  },
  orange: {
    surface:
      "border-[var(--sl-color-orange)] bg-[var(--sl-color-orange-low)] text-[var(--sl-color-orange)]",
    fill: "bg-[var(--sl-color-orange)]",
    text: "text-[var(--sl-color-orange)]",
  },
  neutral: {
    surface:
      "border-[var(--sl-color-gray-4)] bg-[var(--sl-color-gray-6)] text-[var(--sl-color-gray-2)]",
    fill: "bg-[var(--sl-color-gray-4)]",
    text: "text-[var(--sl-color-gray-2)]",
  },
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DemoShell({ eyebrow, title, description, children }: DemoShellProps) {
  return (
    <section
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-[20px] border border-[var(--sl-color-hairline-light)] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
      style={{
        background: [
          "radial-gradient(circle at top right, var(--sl-color-accent-low), transparent 34%)",
          "linear-gradient(180deg, var(--sl-color-bg), var(--sl-color-gray-6))",
        ].join(", "),
      }}
    >
      <div className="flex flex-col gap-2">
        <div
          className={cx(
            "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]",
            toneClasses.accent.surface
          )}
        >
          {eyebrow}
        </div>
        <div className="m-0 text-[20px] font-bold leading-tight text-[var(--sl-color-text)]">
          {title}
        </div>
        <p className="m-0 text-[13px] leading-6 text-[var(--sl-color-gray-3)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DemoPanel({
  title,
  description,
  tone = "neutral",
  aside,
  children,
}: DemoPanelProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 rounded-[18px] border bg-[var(--sl-color-gray-6)] p-3.5",
        toneClasses[tone].surface
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className={cx("h-1 w-10 rounded-full", toneClasses[tone].fill)} />
          <div className="m-0 text-[14px] font-bold text-[var(--sl-color-text)]">{title}</div>
          {description ? (
            <p className="m-0 text-[12px] leading-5 text-[var(--sl-color-gray-3)]">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <div
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold",
        toneClasses[tone].surface
      )}
    >
      {label}
    </div>
  );
}

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col gap-2 rounded-2xl border p-3",
        toneClasses[tone].surface
      )}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.04em]">{label}</div>
      <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-bold text-[var(--sl-color-text)]">
        {value}
      </div>
    </div>
  );
}

export function ValueToken({ children }: ValueTokenProps) {
  return (
    <span className="inline-flex max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-2.5 py-1.5 font-mono text-[13px] font-semibold text-[var(--sl-color-text)]">
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  disabled = false,
  tone = "neutral",
  grow = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "m-0 rounded-xl border px-3.5 py-2.5 text-[13px] font-bold leading-none transition-colors",
        "disabled:cursor-not-allowed disabled:border-[var(--sl-color-hairline-light)] disabled:bg-[var(--sl-color-gray-6)] disabled:text-[var(--sl-color-gray-3)] disabled:opacity-60",
        grow && "flex-1 basis-40",
        !disabled && toneClasses[tone].surface
      )}
    >
      {children}
    </button>
  );
}

export function HistoryList({
  title,
  emptyText,
  history$,
  tone = "accent",
  renderSnapshot,
}: HistoryListProps) {
  return (
    <DemoPanel title={title} description="Newest snapshot is pinned at the top." tone={tone}>
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

export const demoClasses = {
  actionRow: "flex flex-wrap gap-2",
  counterRow: "grid items-center gap-2.5 grid-cols-[auto_minmax(92px,1fr)_auto]",
  counterValue:
    "grid min-h-[58px] place-items-center rounded-2xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-3 py-2 text-[28px] font-extrabold leading-none text-[var(--sl-color-text)]",
  input:
    "w-full rounded-xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-[13px] py-[11px] text-sm leading-5 text-[var(--sl-color-text)] caret-[var(--sl-color-accent)] outline-none focus:ring-2 focus:ring-[var(--sl-color-accent)]",
  numberInput:
    "w-28 rounded-xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-3 py-2 text-sm leading-5 text-[var(--sl-color-text)] caret-[var(--sl-color-accent)] outline-none focus:ring-2 focus:ring-[var(--sl-color-accent)]",
  settingField: "flex min-w-[152px] flex-col gap-1.5",
  settingLabel: "text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--sl-color-gray-3)]",
  settingRow: "flex flex-wrap items-end justify-between gap-3",
  slider: "m-0 w-full accent-[var(--sl-color-accent)]",
  statsGrid: "grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]",
  valueRow: "flex flex-wrap items-center justify-between gap-3",
} as const;
