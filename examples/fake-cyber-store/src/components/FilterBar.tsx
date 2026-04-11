"use client";

import { observable } from "@legendapp/state";
import { observe } from "@usels/core";
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from "@/data/products";
import { getCyberStore } from "@/store/cyberStore";
import type { ProductCategory, SortMode } from "@/types";
import { labelize } from "@/components/format";
import { createDebounced } from "@usels/core";

export function FilterBar() {
  "use scope";
  const { category$, query$, resetFilters, setCategory, setQuery, setSort, sort$ } =
    getCyberStore();
  const draftQuery$ = observable(query$.peek());
  const debouncedQuery$ = createDebounced(draftQuery$, { ms: 120 });
  const clearFilters = () => {
    draftQuery$.set("");
    resetFilters();
  };

  observe(() => {
    setQuery(debouncedQuery$.get());
  });

  return (
    <section className="grid gap-3 border-b border-[var(--hairline)] pb-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Search</span>
        <input
          value={draftQuery$.get()}
          onChange={(event) => draftQuery$.set(event.target.value)}
          placeholder="Keyboard, security, wearable"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Class</span>
        <select
          value={category$.get()}
          onChange={(event) => setCategory(event.target.value as ProductCategory)}
          className="min-w-0 flex-1 bg-[var(--panel)] text-sm text-white outline-none"
        >
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {labelize(category)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Sort</span>
        <select
          value={sort$.get()}
          onChange={(event) => setSort(event.target.value as SortMode)}
          className="min-w-0 flex-1 bg-[var(--panel)] text-sm text-white outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={clearFilters}
        className="min-h-12 rounded-lg border border-[var(--hairline)] px-4 text-sm font-bold text-white transition hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
      >
        Reset filters
      </button>
    </section>
  );
}
