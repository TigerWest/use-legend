"use client";

import { useEffect, useState } from "react";
import { PRODUCT_CATEGORIES, SORT_OPTIONS } from "@/data/products";
import { formatCurrency, labelize } from "@/components/format";
import { useReactCyberStore, type ReactCyberStore } from "@/store/reactCyberStore";
import type { CartLine, Product, ProductCategory, SortMode } from "@/types";

interface StoreProps {
  store: ReactCyberStore;
}

export function ReactStateStorefront() {
  const store = useReactCyberStore();

  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <ReactStateTopBar store={store} />
        <ReactStateFilterBar store={store} />
        <ReactStateTotalsBar store={store} />
        <ReactStateProductGrid store={store} />
      </div>
      <ReactStateCartDrawer store={store} />
    </main>
  );
}

function ReactStateTopBar({ store }: StoreProps) {
  const { cartCount, isCartHydrated, openCart, subtotal } = store;

  return (
    <header className="flex flex-col gap-3 border-b border-[var(--hairline)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-[var(--green)]">Fake Cyber Store</p>
        <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
          React state gear lab
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Plain React shopping state passed through the page by props.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <a
            href="/"
            className="text-[var(--yellow)] underline-offset-4 transition hover:text-white hover:underline"
          >
            Global store version
          </a>
          <a
            href="/props-drilling"
            className="text-[var(--yellow)] underline-offset-4 transition hover:text-white hover:underline"
          >
            Local observable version
          </a>
        </div>
        <button
          type="button"
          onClick={openCart}
          className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[var(--green)] bg-[var(--green)] px-4 py-2 text-sm font-bold text-black shadow-[0_0_24px_rgba(185,255,53,0.22)] transition hover:bg-white sm:min-w-56"
        >
          <span>Open cart</span>
          <span className="rounded-md bg-black px-2 py-1 text-white">
            {isCartHydrated ? cartCount : 0} / {formatCurrency(isCartHydrated ? subtotal : 0)}
          </span>
        </button>
      </div>
    </header>
  );
}

function ReactStateFilterBar({ store }: StoreProps) {
  const { category, query, resetFilters, setCategory, setQuery, setSort, sort } = store;
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(draftQuery), 120);
    return () => window.clearTimeout(timeout);
  }, [draftQuery, setQuery]);

  const clearFilters = () => {
    setDraftQuery("");
    resetFilters();
  };

  return (
    <section className="grid gap-3 border-b border-[var(--hairline)] pb-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Search</span>
        <input
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="Keyboard, security, wearable"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Class</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as ProductCategory)}
          className="min-w-0 flex-1 bg-[var(--panel)] text-sm text-white outline-none"
        >
          {PRODUCT_CATEGORIES.map((productCategory) => (
            <option key={productCategory} value={productCategory}>
              {labelize(productCategory)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3">
        <span className="text-xs font-bold uppercase text-[var(--green)]">Sort</span>
        <select
          value={sort}
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

function ReactStateTotalsBar({ store }: StoreProps) {
  const { cartCount, filteredProducts, isCartHydrated, subtotal } = store;

  return (
    <section className="grid gap-2 text-sm sm:grid-cols-3">
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Catalog match</span>
        <strong className="text-lg text-white">{filteredProducts.length}</strong>
      </div>
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Cart units</span>
        <strong className="text-lg text-white">{isCartHydrated ? cartCount : 0}</strong>
      </div>
      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-3 py-2">
        <span className="block text-xs uppercase text-[var(--muted)]">Subtotal</span>
        <strong className="text-lg text-[var(--green)]">
          {formatCurrency(isCartHydrated ? subtotal : 0)}
        </strong>
      </div>
    </section>
  );
}

function ReactStateProductGrid({ store }: StoreProps) {
  const { filteredProducts } = store;

  if (filteredProducts.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-[var(--hairline)] bg-[var(--panel)] px-6 py-12 text-center text-sm text-[var(--muted)]">
        No matching gear. Reset filters or try another signal.
      </div>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredProducts.map((product) => (
        <ReactStateProductCard key={product.id} store={store} product={product} />
      ))}
    </section>
  );
}

function ReactStateProductCard({ product, store }: StoreProps & { product: Product }) {
  const { addToCart, cart, isCartHydrated } = store;
  const [quantityDraft, setQuantityDraftValue] = useState(1);
  const setQuantityDraft = (quantity: number) => {
    setQuantityDraftValue(Math.max(1, Math.min(product.stock, Math.floor(quantity))));
  };
  const decreaseDraft = () => setQuantityDraft(quantityDraft - 1);
  const increaseDraft = () => setQuantityDraft(quantityDraft + 1);
  const addDraftToCart = () => addToCart(product.id, quantityDraft);

  return (
    <article className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--panel)]">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-[var(--hairline)] bg-[var(--panel-strong)]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-xs font-bold uppercase text-[var(--green)]">
          {labelize(product.category)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black leading-6 text-white">{product.name}</h2>
            <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{product.tagline}</p>
          </div>
          <div className="shrink-0 rounded-md border border-[var(--hairline)] px-2 py-1 text-sm font-black text-[var(--yellow)]">
            {formatCurrency(product.price)}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Rating {product.rating.toFixed(1)}
          </span>
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Stock {product.stock}
          </span>
          <span className="rounded-md bg-[var(--panel-strong)] px-2 py-1">
            Cart {isCartHydrated ? (cart[product.id] ?? 0) : 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-11 w-28 grid-cols-3 overflow-hidden rounded-lg border border-[var(--hairline)]">
            <button
              type="button"
              onClick={decreaseDraft}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Decrease ${product.name} quantity`}
            >
              -
            </button>
            <span className="flex items-center justify-center text-sm font-black text-white">
              {quantityDraft}
            </span>
            <button
              type="button"
              onClick={increaseDraft}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Increase ${product.name} quantity`}
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

function ReactStateCartDrawer({ store }: StoreProps) {
  const { cartCount, cartLines, clearCart, closeCart, isCartHydrated, isCartOpen, subtotal } =
    store;

  if (!isCartOpen) return null;

  return (
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
              {isCartHydrated ? "Local cart ready" : "Loading cart"}
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
        {isCartHydrated && cartLines.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {cartLines.map((line) => (
                <ReactStateCartLineItem key={line.product.id} store={store} line={line} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm leading-6 text-[var(--muted)]">
            Your cart is empty. Add gear from the grid to stage a local order.
          </div>
        )}
        <footer className="border-t border-[var(--hairline)] p-4">
          <div className="mb-3 flex items-center justify-between text-sm text-[var(--muted)]">
            <span>{isCartHydrated ? cartCount : 0} units</span>
            <strong className="text-xl text-[var(--green)]">
              {formatCurrency(isCartHydrated ? subtotal : 0)}
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
  );
}

function ReactStateCartLineItem({ line, store }: StoreProps & { line: CartLine }) {
  const { decrementCartItem, incrementCartItem, removeCartItem } = store;
  const { product } = line;

  return (
    <article className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--panel)] p-3">
      <img src={product.image} alt={product.name} className="h-24 w-full rounded-md object-cover" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-white">{product.name}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">{formatCurrency(product.price)} each</p>
          </div>
          <button
            type="button"
            onClick={() => removeCartItem(product.id)}
            className="h-8 w-8 rounded-md border border-[var(--hairline)] text-sm text-white transition hover:border-[var(--red)] hover:text-[var(--red)]"
            aria-label={`Remove ${product.name}`}
          >
            x
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="grid h-9 w-28 grid-cols-3 overflow-hidden rounded-lg border border-[var(--hairline)]">
            <button
              type="button"
              onClick={() => decrementCartItem(product.id)}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Decrease ${product.name} quantity`}
            >
              -
            </button>
            <span className="flex items-center justify-center text-sm font-black text-white">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => incrementCartItem(product.id)}
              className="bg-[var(--panel-strong)] text-white transition hover:bg-zinc-700"
              aria-label={`Increase ${product.name} quantity`}
            >
              +
            </button>
          </div>
          <strong className="text-sm text-[var(--green)]">{formatCurrency(line.lineTotal)}</strong>
        </div>
      </div>
    </article>
  );
}
