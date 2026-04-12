"use client";
import { useScope } from "@usels/core";
import type { Fn } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import {
  createOnClickOutside,
  type OnClickOutsideHandler,
  type OnClickOutsideOptions,
  type OnClickOutsideReturn,
} from "./core";

export { createOnClickOutside } from "./core";
export type { OnClickOutsideHandler, OnClickOutsideOptions, OnClickOutsideReturn } from "./core";

export type UseOnClickOutside = typeof createOnClickOutside;

export const useOnClickOutside: UseOnClickOutside = ((
  target: MaybeEventTarget,
  handler: OnClickOutsideHandler<OnClickOutsideOptions<boolean>>,
  options: OnClickOutsideOptions<boolean> = {}
): Fn | OnClickOutsideReturn => {
  return useScope(
    (p) => {
      // Handler freshness via scope props — latest closure on each event dispatch.
      const fresh: OnClickOutsideHandler<OnClickOutsideOptions<boolean>> = (ev) => {
        const latest = p.handler as
          | OnClickOutsideHandler<OnClickOutsideOptions<boolean>>
          | undefined;
        latest?.(ev);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overload dispatch requires casting
      return (createOnClickOutside as any)(target, fresh, options) as Fn | OnClickOutsideReturn;
    },
    { handler }
  );
}) as UseOnClickOutside;
