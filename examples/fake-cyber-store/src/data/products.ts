import type { Product, ProductCategory, SortMode } from "@/types";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "all",
  "hardware",
  "wearables",
  "security",
  "accessories",
];

export const SORT_OPTIONS: Array<{ label: string; value: SortMode }> = [
  { label: "Featured", value: "featured" },
  { label: "Price: low first", value: "price-asc" },
  { label: "Price: high first", value: "price-desc" },
  { label: "Top rated", value: "rating" },
];

export const PRODUCTS: Product[] = [
  {
    id: "cipher-keyboard",
    name: "Cipher Deck 68",
    tagline: "Low-profile mechanical board with isolated signal rows.",
    category: "hardware",
    price: 149,
    rating: 4.8,
    stock: 8,
    image: "/products/cipher-keyboard.webp",
  },
  {
    id: "zero-day-mouse",
    name: "Zero Day Pointer",
    tagline: "Ergonomic sensor body tuned for precise packet chasing.",
    category: "hardware",
    price: 89,
    rating: 4.6,
    stock: 12,
    image: "/products/zero-day-mouse.webp",
  },
  {
    id: "specter-headset",
    name: "Specter Comms",
    tagline: "Closed-back headset with a clean mic chain and mute rail.",
    category: "accessories",
    price: 129,
    rating: 4.7,
    stock: 6,
    image: "/products/specter-headset.webp",
  },
  {
    id: "mesh-watch",
    name: "Mesh Pulse Watch",
    tagline: "Wearable status node with haptics and field alerts.",
    category: "wearables",
    price: 199,
    rating: 4.4,
    stock: 5,
    image: "/products/mesh-watch.webp",
  },
  {
    id: "firewall-node",
    name: "Firewall Node Mini",
    tagline: "Tiny desk appliance for a pretend hardened edge.",
    category: "security",
    price: 249,
    rating: 4.9,
    stock: 4,
    image: "/products/firewall-node.webp",
  },
  {
    id: "vr-visor",
    name: "Ghost Visor XR",
    tagline: "Immersive lens kit for tabletop incident-room drills.",
    category: "wearables",
    price: 349,
    rating: 4.5,
    stock: 3,
    image: "/products/ghost-visor.webp",
  },
];
