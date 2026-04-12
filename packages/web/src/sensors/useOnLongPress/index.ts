"use client";
import { useScope, toObs } from "@usels/core";
import { createOnLongPress } from "./core";

export { createOnLongPress } from "./core";
export type { UseOnLongPressModifiers, UseOnLongPressOptions } from "./core";

export type UseOnLongPress = typeof createOnLongPress;
export const useOnLongPress: UseOnLongPress = (target, handler, options = {}) => {
  return useScope(
    (cbs, options) => {
      const cbs$ = toObs(cbs, { handler: "function" });
      const options$ = toObs(options, { onMouseUp: "function" });
      return createOnLongPress(target, cbs$.handler, options$);
    },
    { handler },
    options
  );
};
