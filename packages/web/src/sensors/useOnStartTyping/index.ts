"use client";
import { toObs, useScope } from "@usels/core";
import { createOnStartTyping } from "./core";

export { createOnStartTyping } from "./core";
export type { OnStartTypingCallback } from "./core";

export function useOnStartTyping(callback: (event: KeyboardEvent) => void): void {
  useScope(
    (p) => {
      const p$ = toObs(p);
      createOnStartTyping(p$.callback);
      return {};
    },
    { callback }
  );
}
