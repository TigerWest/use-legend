"use client";

import type { Observable } from "@usels/core";
import { formatCurrency } from "@/components/format";
import { getCyberStore } from "@/store/cyberStore";
import type { CartLine } from "@/types";
import { Memo } from "@usels/core";

export function CartLineItem({ line$ }: { line$: Observable<CartLine> }) {
  "use scope";
  const { decrementCartItem, incrementCartItem, removeCartItem } = getCyberStore();
  const productId = () => line$.product.id.peek();

  return (
    <article className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] p-3">
      <Memo>
        <img
          src={line$.product.image.get()}
          alt={line$.product.name.get()}
          className="h-24 w-full rounded-md object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-white">{line$.product.name.get()}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {formatCurrency(line$.product.price.get())} each
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeCartItem(productId())}
              className="h-8 w-8 rounded-md border border-[var(--hairline)] text-sm text-white transition hover:border-[var(--red)] hover:text-[var(--red)]"
              aria-label={`Remove ${line$.product.name.get()}`}
            >
              x
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="grid h-9 w-28 grid-cols-3 overflow-hidden rounded-lg border border-[var(--hairline)]">
              <button
                type="button"
                onClick={() => decrementCartItem(productId())}
                className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
                aria-label={`Decrease ${line$.product.name.get()} quantity`}
              >
                -
              </button>
              <span className="flex items-center justify-center text-sm font-black text-white">
                {line$.quantity.get()}
              </span>
              <button
                type="button"
                onClick={() => incrementCartItem(productId())}
                className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
                aria-label={`Increase ${line$.product.name.get()} quantity`}
              >
                +
              </button>
            </div>
            <strong className="text-sm text-[var(--green)]">
              {formatCurrency(line$.lineTotal.get())}
            </strong>
          </div>
        </div>
      </Memo>
    </article>
  );
}
