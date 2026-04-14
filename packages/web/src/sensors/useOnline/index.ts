"use client";
import { useScope } from "@usels/core";
import { createOnline } from "./core";

export { createOnline } from "./core";
export type { UseOnlineOptions, UseOnlineReturn } from "./core";

export type UseOnline = typeof createOnline;
export const useOnline: UseOnline = (options = {}) => {
  return useScope(() => createOnline(options));
};
