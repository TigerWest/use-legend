"use client";

import { CartDrawer } from "@/components/CartDrawer";
import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { TopBar } from "@/components/TopBar";
import { TotalsBar } from "@/components/TotalsBar";

export function Storefront() {
  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <TopBar />
        <FilterBar />
        <TotalsBar />
        <ProductGrid />
      </div>
      <CartDrawer />
    </main>
  );
}
