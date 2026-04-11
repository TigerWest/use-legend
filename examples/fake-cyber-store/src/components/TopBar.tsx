"use client";

import { getCyberStore } from "@/store/cyberStore";
import { formatCurrency } from "@/components/format";

export function TopBar() {
  "use scope";
  const { cartCount$, isCartHydrated$, openCart, subtotal$ } = getCyberStore();

  return (
    <header className="flex flex-col gap-3 border-b border-[var(--hairline)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-[var(--green)]">Fake Cyber Store</p>
        <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
          Frontend gear lab
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Observable-first shopping state with local cart storage.
        </p>
      </div>
      <button
        type="button"
        onClick={openCart}
        className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[var(--green)] bg-[var(--green)] px-4 py-2 text-sm font-bold text-black shadow-[0_0_24px_rgba(185,255,53,0.22)] transition hover:bg-white sm:min-w-56"
      >
        <span>Open cart</span>
        <span className="rounded-md bg-black px-2 py-1 text-white">
          {isCartHydrated$.get() ? cartCount$.get() : 0} /{" "}
          {formatCurrency(isCartHydrated$.get() ? subtotal$.get() : 0)}
        </span>
      </button>
    </header>
  );
}
