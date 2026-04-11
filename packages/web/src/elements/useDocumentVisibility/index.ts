"use client";
import { useScope } from "@usels/core";
import { createDocumentVisibility } from "./core";

export { createDocumentVisibility } from "./core";

export type UseDocumentVisibility = typeof createDocumentVisibility;
export const useDocumentVisibility: UseDocumentVisibility = () => {
  return useScope(() => createDocumentVisibility());
};
