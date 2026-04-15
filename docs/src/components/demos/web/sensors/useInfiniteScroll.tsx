"use client";
import { For, Show, useObservable, useRef$ } from "@usels/core";
import { useInfiniteScroll } from "@usels/web";
import {
  ActionButton,
  DemoPanel,
  DemoShell,
  StatCard,
  StatusBadge,
  demoClasses,
} from "../../_shared";

const ITEMS_PER_PAGE = 10;
const MAX_ITEMS = 50;

function makeItems(from: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Item ${from + i + 1}`);
}

export default function UseInfiniteScrollDemo() {
  const el$ = useRef$<HTMLDivElement>();
  const items$ = useObservable<string[]>(makeItems(0, ITEMS_PER_PAGE));
  const hasMore$ = useObservable(true);

  const { isLoading$, reset } = useInfiniteScroll(
    el$,
    async () => {
      await new Promise<void>((r) => setTimeout(r, 800));
      const current = items$.peek();
      if (current.length >= MAX_ITEMS) {
        hasMore$.set(false);
        return;
      }
      const next = makeItems(current.length, Math.min(ITEMS_PER_PAGE, MAX_ITEMS - current.length));
      items$.set([...current, ...next]);
    },
    {
      canLoadMore: () => hasMore$.peek(),
    }
  );

  function handleReset() {
    items$.set(makeItems(0, ITEMS_PER_PAGE));
    hasMore$.set(true);
    reset();
  }

  const statusLabel$ = useObservable(() =>
    !hasMore$.get() ? "Finished" : isLoading$.get() ? "Loading" : "Idle"
  );

  const statusTone$ = useObservable(() =>
    !hasMore$.get() ? "neutral" : isLoading$.get() ? "orange" : "green"
  );

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="useInfiniteScroll"
        description="Scroll to the bottom of the list to load more items."
        aside={<StatusBadge label={statusLabel$.get()} tone={statusTone$.get()} />}
      >
        <div className={demoClasses.statsGrid}>
          <StatCard label="Items" value={items$.get().length} tone="accent" />
          <StatCard label="Max" value={MAX_ITEMS} />
        </div>

        {/* Scrollable list */}
        <div
          ref={el$}
          style={{
            height: "240px",
            overflowY: "auto",
            borderRadius: "12px",
            border: "1px solid var(--sl-color-gray-5, #cbd5e1)",
            background: "var(--sl-color-bg)",
          }}
        >
          <For each={items$}>
            {(item$) => (
              <div
                style={{
                  padding: "8px 14px",
                  borderBottom: "1px solid var(--sl-color-gray-6, #f1f5f9)",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "var(--sl-color-gray-2, #475569)",
                }}
              >
                {item$.get()}
              </div>
            )}
          </For>

          <Show if={isLoading$}>
            <div
              style={{
                padding: "12px 14px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "var(--sl-color-gray-3, #94a3b8)",
                textAlign: "center",
              }}
            >
              Loading…
            </div>
          </Show>

          <Show if={() => !hasMore$.get()}>
            <div
              style={{
                padding: "12px 14px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "var(--sl-color-gray-3, #94a3b8)",
                textAlign: "center",
              }}
            >
              No more items
            </div>
          </Show>
        </div>

        <div className={demoClasses.actionRow}>
          <ActionButton onClick={handleReset} tone="accent" grow>
            Reset
          </ActionButton>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
