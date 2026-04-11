export type ProductCategory = "all" | "hardware" | "wearables" | "security" | "accessories";

export type StoreProductCategory = Exclude<ProductCategory, "all">;

export type SortMode = "featured" | "price-asc" | "price-desc" | "rating";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: StoreProductCategory;
  price: number;
  rating: number;
  stock: number;
  image: string;
}

export type CartSnapshot = Record<string, number>;

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}
