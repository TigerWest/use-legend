"use client";

import type { Observable } from "@legendapp/state";
import { For, Show } from "@legendapp/state/react";
import { ProductCard } from "@/components/ProductCard";
import { getCyberStore } from "@/store/cyberStore";
import type { Product } from "@/types";

export function ProductGrid() {
  "use scope";
  const { filteredProducts$ } = getCyberStore();

  return (
    <Show
      if={() => filteredProducts$.get().length > 0}
      else={
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          No matching gear. Reset filters or try another signal.
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <For each={filteredProducts$ as unknown as Observable<Product[]>}>
          {(product$) => <ProductCard product$={product$} />}
        </For>
      </section>
    </Show>
  );
}
