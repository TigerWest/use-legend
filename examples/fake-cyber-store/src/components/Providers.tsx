"use client";

import { StoreProvider } from "@usels/core";
import { onMount } from "@usels/core";
import { getCyberStore } from "@/store/cyberStore";

function StoreMount({ children }: { children: React.ReactNode }) {
  "use scope";
  const { hydrateCart } = getCyberStore();
  onMount(hydrateCart);

  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider _devtools>
      <StoreMount>{children}</StoreMount>
    </StoreProvider>
  );
}
