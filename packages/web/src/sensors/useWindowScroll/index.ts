"use client";
import { type UseScrollOptions, type UseScrollReturn, useScroll } from "@sensors/useScroll";
import { defaultWindow } from "@usels/core/shared/configurable";

export type { UseScrollOptions, UseScrollReturn };

export function useWindowScroll(options?: UseScrollOptions): UseScrollReturn {
  return useScroll(defaultWindow ?? null, options);
}
