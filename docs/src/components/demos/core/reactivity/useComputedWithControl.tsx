import type { Observable } from "@legendapp/state";
import { For, useObservable } from "@legendapp/state/react";
import { useComputedWithControl } from "@usels/core";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "@demos/_shared";

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

  return (
    <DemoShell eyebrow="Controlled Compute">
      <DemoPanel
        title="Product search"
        description="Search is the tracked source — typing recomputes. Category & Sort are untracked — press Apply Filters to trigger manually."
        aside={<StatusBadge label={`${computeCount$.get()} runs`} tone="accent" />}
      >
        <input
          type="text"
          placeholder="Search products..."
          value={query$.get()}
          onChange={(e) => query$.set(e.target.value)}
          className={demoClasses.input}
        />
        <div className={`${demoClasses.settingRow} justify-start`}>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel}>Category</label>
            <select
              value={category$.get()}
              onChange={(e) => category$.set(e.target.value)}
              className={demoClasses.numberInput}
            >
              <option value="all">All</option>
              <option value="electronics">Electronics</option>
              <option value="office">Office</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>
          <div className={demoClasses.settingField}>
            <label className={demoClasses.settingLabel}>Sort</label>
            <select
              value={sortBy$.get()}
              onChange={(e) => sortBy$.set(e.target.value as "name" | "price")}
              className={demoClasses.numberInput}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>
          <ActionButton onClick={applyFilters} tone="accent">
            Apply Filters
          </ActionButton>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          <For each={results$ as unknown as Observable<Product[]>} optimized>
            {(item$) => (
              <li className="flex items-center justify-between rounded-xl border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-3 py-2">
                <span className="text-sm text-[var(--sl-color-text)]">
                  {item$.name.get()}{" "}
                  <span className="text-xs text-[var(--sl-color-gray-3)]">
                    ({item$.category.get()})
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--sl-color-text)]">
                  {item$.price.get().toLocaleString()}won
                </span>
              </li>
            )}
          </For>
          {results$.get().length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--sl-color-gray-3)]">No results</li>
          )}
        </ul>
      </DemoPanel>
    </DemoShell>
  );
}
