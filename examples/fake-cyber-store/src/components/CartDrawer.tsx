"use client";

import type { Observable } from "@legendapp/state";
import { For, Show } from "@legendapp/state/react";
import { CartLineItem } from "@/components/CartLineItem";
import { formatCurrency } from "@/components/format";
import { getCyberStore } from "@/store/cyberStore";
import type { CartLine } from "@/types";

export function CartDrawer() {
  "use scope";
  const { cartCount$, cartLines$, clearCart, closeCart, isCartHydrated$, isCartOpen$, subtotal$ } =
    getCyberStore();

  return (
    <Show if={isCartOpen$}>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
        <button
          type="button"
          aria-label="Close cart"
          onClick={closeCart}
          className="absolute inset-0 cursor-default"
        />
        <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--hairline)] bg-[var(--page-bg)] shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] p-4">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--green)]">
                {isCartHydrated$.get() ? "Local cart ready" : "Loading cart"}
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">Cart relay</h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="h-10 w-10 rounded-lg border border-[var(--hairline)] text-xl text-white transition hover:border-[var(--red)] hover:text-[var(--red)]"
              aria-label="Close cart"
            >
              x
            </button>
          </header>
          <Show
            if={() => isCartHydrated$.get() && cartLines$.get().length > 0}
            else={
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm leading-6 text-[var(--muted)]">
                Your cart is empty. Add gear from the grid to stage a local order.
              </div>
            }
          >
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                <For each={cartLines$ as unknown as Observable<CartLine[]>} optimized>
                  {(line$) => <CartLineItem line$={line$} />}
                </For>
              </div>
            </div>
          </Show>
          <footer className="border-t border-[var(--hairline)] p-4">
            <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)]">
              <span>{isCartHydrated$.get() ? cartCount$.get() : 0} units</span>
              <strong className="text-xl text-[var(--green)]">
                {formatCurrency(isCartHydrated$.get() ? subtotal$.get() : 0)}
              </strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="h-11 rounded-lg border border-[var(--hairline)] px-3 text-sm font-bold text-white transition hover:border-[var(--red)] hover:text-[var(--red)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="h-11 rounded-lg bg-[var(--green)] px-3 text-sm font-black text-black transition hover:bg-white"
              >
                Keep browsing
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </Show>
  );
}
