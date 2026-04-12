"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import type { CartLine, CartSnapshot, Product, ProductCategory, SortMode } from "@/types";

const STORAGE_KEY = "fake-cyber-store.react-state.cart.v1";
const productById = new Map(PRODUCTS.map((product) => [product.id, product]));

function clampQuantity(product: Product, quantity: number) {
  return Math.max(0, Math.min(product.stock, Math.floor(quantity)));
}

function validateCartSnapshot(snapshot: unknown): CartSnapshot {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return {};

  const next: CartSnapshot = {};
  for (const [productId, rawQuantity] of Object.entries(snapshot)) {
    const product = productById.get(productId);
    if (!product || typeof rawQuantity !== "number" || !Number.isFinite(rawQuantity)) continue;

    const quantity = clampQuantity(product, rawQuantity);
    if (quantity > 0) next[productId] = quantity;
  }

  return next;
}

function readStoredCart() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return validateCartSnapshot(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStoredCart(cart: CartSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validateCartSnapshot(cart)));
  } catch {
    // localStorage may be unavailable in private browsing or restricted embeds.
  }
}

export function useReactCyberStore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [cart, setCart] = useState<CartSnapshot>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartHydrated, setIsCartHydrated] = useState(false);

  useEffect(() => {
    setCart(readStoredCart());
    setIsCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!isCartHydrated) return;
    writeStoredCart(cart);
  }, [cart, isCartHydrated]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = PRODUCTS.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.tagline.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

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
  }, [category, query, sort]);

  const cartLines = useMemo<CartLine[]>(
    () =>
      PRODUCTS.flatMap((product) => {
        const quantity = cart[product.id] ?? 0;
        if (quantity <= 0) return [];

        return [
          {
            product,
            quantity,
            lineTotal: product.price * quantity,
          },
        ];
      }),
    [cart]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    [cart]
  );
  const subtotal = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineTotal, 0),
    [cartLines]
  );

  const resetFilters = useCallback(() => {
    setQuery("");
    setCategory("all");
    setSort("featured");
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const updateCartItem = useCallback(
    (productId: string, getQuantity: (current: number) => number) => {
      const product = productById.get(productId);
      if (!product) return;

      setCart((current) => {
        const next = { ...validateCartSnapshot(current) };
        const nextQuantity = clampQuantity(product, getQuantity(next[productId] ?? 0));
        if (nextQuantity <= 0) delete next[productId];
        else next[productId] = nextQuantity;
        return next;
      });
    },
    []
  );

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      updateCartItem(productId, (current) => current + quantity);
      openCart();
    },
    [openCart, updateCartItem]
  );

  const incrementCartItem = useCallback(
    (productId: string) => updateCartItem(productId, (current) => current + 1),
    [updateCartItem]
  );

  const decrementCartItem = useCallback(
    (productId: string) => updateCartItem(productId, (current) => current - 1),
    [updateCartItem]
  );

  const removeCartItem = useCallback(
    (productId: string) => updateCartItem(productId, () => 0),
    [updateCartItem]
  );

  const clearCart = useCallback(() => setCart({}), []);

  return useMemo(
    () => ({
      products: PRODUCTS,
      query,
      category,
      sort,
      cart,
      isCartOpen,
      isCartHydrated,
      filteredProducts,
      cartLines,
      cartCount,
      subtotal,
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
    }),
    [
      addToCart,
      cart,
      cartCount,
      cartLines,
      category,
      clearCart,
      closeCart,
      decrementCartItem,
      filteredProducts,
      incrementCartItem,
      isCartHydrated,
      isCartOpen,
      openCart,
      query,
      removeCartItem,
      resetFilters,
      sort,
      subtotal,
    ]
  );
}

export type ReactCyberStore = ReturnType<typeof useReactCyberStore>;
