"use client";

import { batch, observable } from "@usels/core";
import { createStore, onMount } from "@usels/core";
import { createLocalStorage } from "@usels/web";
import { PRODUCTS } from "@/data/products";
import type { CartLine, CartSnapshot, Product, ProductCategory, SortMode } from "@/types";

const STORAGE_KEY = "fake-cyber-store.cart.v1";
const productById = new Map(PRODUCTS.map((product) => [product.id, product]));

// function createLocalStorage<T>(key: string, defaults: T) {
//   return createStorage(key, defaults, { plugin: ObservablePersistLocalStorage }).data$;
// }

function clampQuantity(product: Product, quantity: number) {
  return Math.max(0, Math.min(product.stock, Math.floor(quantity)));
}

function validateCartSnapshot(snapshot: CartSnapshot | undefined): CartSnapshot {
  if (!snapshot || typeof snapshot !== "object") return {};

  const next: CartSnapshot = {};
  for (const [productId, rawQuantity] of Object.entries(snapshot)) {
    const product = productById.get(productId);
    if (!product || typeof rawQuantity !== "number" || !Number.isFinite(rawQuantity)) continue;

    const quantity = clampQuantity(product, rawQuantity);
    if (quantity > 0) next[productId] = quantity;
  }

  return next;
}

function sameSnapshot(a: CartSnapshot, b: CartSnapshot) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

export const [useCyberStore, getCyberStore] = createStore("fake-cyber-store", () => {
  const products$ = observable<Product[]>(PRODUCTS);
  const query$ = observable("");
  const category$ = observable<ProductCategory>("all");
  const sort$ = observable<SortMode>("featured");
  const cart$ = createLocalStorage<CartSnapshot>(STORAGE_KEY, {});
  const isCartOpen$ = observable(false);
  const isCartHydrated$ = observable(false);

  const filteredProducts$ = observable<Product[]>(() => {
    const query = query$.get().trim().toLowerCase();
    const category = category$.get();
    const sort = sort$.get();
    const filtered = products$.get().filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.tagline.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return (
        PRODUCTS.findIndex((product) => product.id === a.id) -
        PRODUCTS.findIndex((product) => product.id === b.id)
      );
    });
  });

  const cartLines$ = observable<CartLine[]>(() => {
    const snapshot = cart$.get();

    return PRODUCTS.flatMap((product) => {
      const quantity = snapshot[product.id] ?? 0;
      if (quantity <= 0) return [];

      return [
        {
          product,
          quantity,
          lineTotal: product.price * quantity,
        },
      ];
    });
  });

  const cartCount$ = observable(() =>
    Object.values(cart$.get()).reduce((total, quantity) => total + quantity, 0)
  );

  const subtotal$ = observable(() =>
    cartLines$.get().reduce((total, line) => total + line.lineTotal, 0)
  );

  const setQuery = (query: string) => query$.set(query);
  const setCategory = (category: ProductCategory) => category$.set(category);
  const setSort = (sort: SortMode) => sort$.set(sort);

  const resetFilters = () => {
    batch(() => {
      query$.set("");
      category$.set("all");
      sort$.set("featured");
    });
  };

  const openCart = () => isCartOpen$.set(true);
  const closeCart = () => isCartOpen$.set(false);

  const setCartItem = (productId: string, quantity: number) => {
    const product = productById.get(productId);
    if (!product) return;

    const nextQuantity = clampQuantity(product, quantity);
    cart$.set((current) => {
      const next = { ...validateCartSnapshot(current) };
      if (nextQuantity <= 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  };

  const addToCart = (productId: string, quantity = 1) => {
    const product = productById.get(productId);
    if (!product) return;

    batch(() => {
      const current = cart$.peek()[productId] ?? 0;
      setCartItem(productId, current + quantity);
      openCart();
    });
  };

  const incrementCartItem = (productId: string) => {
    const current = cart$.peek()[productId] ?? 0;
    setCartItem(productId, current + 1);
  };

  const decrementCartItem = (productId: string) => {
    const current = cart$.peek()[productId] ?? 0;
    setCartItem(productId, current - 1);
  };

  const removeCartItem = (productId: string) => setCartItem(productId, 0);
  const clearCart = () => cart$.set({});
  const hydrateCart = () => {
    const validated = validateCartSnapshot(cart$.peek());
    batch(() => {
      if (!sameSnapshot(validated, cart$.peek())) cart$.set(validated);
      isCartHydrated$.set(true);
    });
  };

  onMount(hydrateCart);

  return {
    products$,
    query$,
    category$,
    sort$,
    cart$,
    isCartOpen$,
    isCartHydrated$,
    filteredProducts$,
    cartLines$,
    cartCount$,
    subtotal$,
    setQuery,
    setCategory,
    setSort,
    resetFilters,
    openCart,
    closeCart,
    addToCart,
    incrementCartItem,
    decrementCartItem,
    removeCartItem,
    clearCart,
    hydrateCart,
  };
});
