import type React from "react";
import type { Observable } from "@legendapp/state";
import { For, useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from ".";

interface Product {
  name: string;
  category: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { name: "Wireless Mouse", category: "electronics", price: 29000 },
  { name: "Mechanical Keyboard", category: "electronics", price: 89000 },
  { name: "USB-C Hub", category: "electronics", price: 45000 },
  { name: "Desk Lamp", category: "office", price: 35000 },
  { name: "Monitor Stand", category: "office", price: 52000 },
  { name: "Notebook", category: "office", price: 8000 },
  { name: "Coffee Mug", category: "lifestyle", price: 15000 },
  { name: "Plant Pot", category: "lifestyle", price: 22000 },
];

export default function UseComputedWithControlDemo() {
  const query$ = useObservable("");
  const sortBy$ = useObservable<"name" | "price">("name");
  const category$ = useObservable("all");
  const computeCount$ = useObservable(0);

  // query$ is the source → typing triggers recomputation.
  // sortBy$, category$ are read inside fn but NOT tracked → changes alone don't trigger.
  const { value$: results$, trigger: applyFilters } = useComputedWithControl(
    query$,
    (query: string) => {
      computeCount$.set((v) => v + 1);
      const cat = category$.get();
      const sort = sortBy$.get();
      return PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          (cat === "all" || p.category === cat)
      ).sort((a, b) => (sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)));
    }
  );

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    margin: 0,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    paddingRight: "28px",
  };

  const buttonStyle = {
    ...inputStyle,
    cursor: "pointer",
    fontWeight: 600,
    margin: 0,
  };

  const descStyle = { fontSize: "13px", color: "#666", margin: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={descStyle}>
        <strong>Search</strong> is the source — typing triggers recomputation immediately.
        <br />
        <strong>Category / Sort</strong> are read inside the getter but are <em>not tracked</em> —
        changing them alone does nothing.
        <br />
        <strong>Apply Filters</strong> calls <code>trigger()</code> to force recomputation with the
        latest category &amp; sort values.
      </p>
      <input
        type="text"
        placeholder="Search products..."
        value={query$.get()}
        onChange={(e) => query$.set(e.target.value)}
        style={{ ...inputStyle, flex: 1 }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={category$.get()}
          onChange={(e) => category$.set(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="office">Office</option>
          <option value="lifestyle">Lifestyle</option>
        </select>
        <select
          value={sortBy$.get()}
          onChange={(e) => sortBy$.set(e.target.value as "name" | "price")}
          style={selectStyle}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>
        <button type="button" onClick={applyFilters} style={buttonStyle}>
          Apply Filters
        </button>
        <span style={{ fontSize: "13px", color: "#888" }}>
          Computed {computeCount$.get()} times
        </span>
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <For each={results$ as unknown as Observable<Product[]>} optimized>
          {(item$) => (
            <li
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {item$.name.get()}{" "}
                <span style={{ color: "#888", fontSize: "12px" }}>({item$.category.get()})</span>
              </span>
              <span>{item$.price.get().toLocaleString()}won</span>
            </li>
          )}
        </For>
        {results$.get().length === 0 && (
          <li style={{ padding: "8px 12px", color: "#888" }}>No results</li>
        )}
      </ul>
    </div>
  );
}
