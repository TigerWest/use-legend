"use client";
import { useScope } from "@usels/core";
import { createParentElement } from "./core";

export { createParentElement } from "./core";

export type UseParentElement = typeof createParentElement;
export const useParentElement: UseParentElement = (element) => {
  return useScope(() => createParentElement(element));
};
