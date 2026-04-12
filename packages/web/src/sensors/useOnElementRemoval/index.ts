"use client";
import { useScope } from "@usels/core";
import { createOnElementRemoval } from "./core";

export { createOnElementRemoval } from "./core";
export type { UseOnElementRemovalOptions } from "./core";

export type UseOnElementRemoval = typeof createOnElementRemoval;
export const useOnElementRemoval: UseOnElementRemoval = (target, callback, options) => {
  useScope(
    (p) => {
      // Callback freshness via scope props — latest closure on each mutation batch.
      const fresh = (mutations: MutationRecord[]) => {
        const latest = p.callback as typeof callback | undefined;
        latest?.(mutations);
      };
      createOnElementRemoval(target, fresh, options);
      return {};
    },
    { callback }
  );
};
