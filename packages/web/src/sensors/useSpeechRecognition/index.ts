"use client";
import { useScope, toObs } from "@usels/core";
import { createSpeechRecognition } from "./core";

export { createSpeechRecognition } from "./core";
export type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from "./core";

/**
 * Reactive wrapper around the
 * [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
 *
 * Exposes the current transcript, finality, and error as observables with
 * `start()` / `stop()` / `toggle()` controls. All option fields are read at
 * each `start()` call so reactive updates apply on the next recognition run.
 */
export type UseSpeechRecognition = typeof createSpeechRecognition;
export const useSpeechRecognition: UseSpeechRecognition = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createSpeechRecognition(opts$);
    },
    options as Record<string, unknown>
  );
};
