"use client";
import type { Observable } from "@legendapp/state";
import { useScope, toObs } from "@usels/core";
import { createSpeechSynthesis } from "./core";

export { createSpeechSynthesis } from "./core";
export type {
  UseSpeechSynthesisOptions,
  UseSpeechSynthesisReturn,
  UseSpeechSynthesisStatus,
  UseSpeechSynthesisErrorData,
} from "./core";

/**
 * Reactive wrapper around the
 * [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
 *
 * Exposes `isPlaying$`, `status$`, and `error$` as observables with
 * `speak()` / `stop()` / `toggle()` controls. Text and option fields are read
 * at each `speak()` call so reactive updates apply on the next utterance.
 */
export type UseSpeechSynthesis = typeof createSpeechSynthesis;
export const useSpeechSynthesis: UseSpeechSynthesis = (text, options = {}) => {
  return useScope(
    (p, opts) => {
      const p$ = toObs(p);
      const opts$ = toObs(opts, { voice: "opaque", window: "opaque" });
      return createSpeechSynthesis(p$.text as Observable<string>, opts$);
    },
    { text },
    options as Record<string, unknown>
  );
};
