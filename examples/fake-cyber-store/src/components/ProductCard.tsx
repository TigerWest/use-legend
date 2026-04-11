"use client";

import { observable, type Observable } from "@legendapp/state";
import { getCyberStore } from "@/store/cyberStore";
import type { Product } from "@/types";
import { formatCurrency, labelize } from "@/components/format";

export function ProductCard({ product$ }: { product$: Observable<Product> }) {
  "use scope";
  const { addToCart, cart$, isCartHydrated$ } = getCyberStore();
  const quantityDraft$ = observable(1);
  const setQuantityDraft = (quantity: number) => {
    const stock = product$.stock.peek();
    quantityDraft$.set(Math.max(1, Math.min(stock, Math.floor(quantity))));
  };
  const decreaseDraft = () => setQuantityDraft(quantityDraft$.peek() - 1);
  const increaseDraft = () => setQuantityDraft(quantityDraft$.peek() + 1);
  const addDraftToCart = () => addToCart(product$.id.peek(), quantityDraft$.peek());

  return (
    <article className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--panel)]">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-[var(--hairline)] bg-[var(--panel-strong)]">
        <img
          src={product$.image.get()}
          alt={product$.name.get()}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-xs font-bold uppercase text-[var(--green)]">
          {labelize(product$.category.get())}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-6 text-white">{product$.name.get()}</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{product$.tagline.get()}</p>
          </div>
          <div className="shrink-0 rounded-md border border-[var(--hairline)] px-2 py-1 text-sm font-black text-[var(--yellow)]">
            {formatCurrency(product$.price.get())}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Rating {product$.rating.get().toFixed(1)}
          </span>
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Stock {product$.stock.get()}
          </span>
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Cart {isCartHydrated$.get() ? (cart$.get()[product$.id.get()] ?? 0) : 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-11 w-28 grid-cols-3 overflow-hidden rounded-lg border border-[var(--hairline)]">
            <button
              type="button"
              onClick={decreaseDraft}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Decrease ${product$.name.get()} quantity`}
            >
              -
            </button>
            <span className="flex items-center justify-center text-sm font-black text-white">
              {quantityDraft$.get()}
            </span>
            <button
              type="button"
              onClick={increaseDraft}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Increase ${product$.name.get()} quantity`}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={addDraftToCart}
            className="h-11 flex-1 rounded-lg bg-[var(--green)] px-3 text-sm font-black text-black transition hover:bg-white"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
