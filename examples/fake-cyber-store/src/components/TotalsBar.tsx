"use client";

import { getCyberStore } from "@/store/cyberStore";
import { formatCurrency } from "@/components/format";

export function TotalsBar() {
  "use scope";
  const { cartCount$, filteredProducts$, isCartHydrated$, subtotal$ } = getCyberStore();

  return (
    <section className="grid gap-2 text-sm sm:grid-cols-3">
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Catalog match</span>
        <strong className="text-lg text-white">{filteredProducts$.get().length}</strong>
      </div>
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Cart units</span>
        <strong className="text-lg text-white">{isCartHydrated$.get() ? cartCount$.get() : 0}</strong>
      </div>
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Subtotal</span>
        <strong className="text-lg text-[var(--green)]">
          {formatCurrency(isCartHydrated$.get() ? subtotal$.get() : 0)}
        </strong>
      </div>
    </section>
  );
}
