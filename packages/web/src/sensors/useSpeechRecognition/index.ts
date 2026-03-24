"use client";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { useMaybeObservable, useSupported } from "@usels/core";
import { batch } from "@legendapp/state";
import { useObservable, useMount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultWindow, type ConfigurableWindow } from "@usels/core/shared/configurable";

// Web Speech API types not yet in TypeScript's standard DOM lib
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export interface UseSpeechRecognitionOptions extends ConfigurableWindow {
  /** Language for recognition. Default: "en-US" */
  lang?: string;
  /** Continuous recognition. Default: true */
  continuous?: boolean;
  /** Return interim results. Default: true */
  interimResults?: boolean;
  /** Maximum number of alternatives per result. Default: 1 */
  maxAlternatives?: number;
}

export interface UseSpeechRecognitionReturn extends Supportable {
  /** Whether currently listening */
  isListening$: ReadonlyObservable<boolean>;
  /** Whether current result is final */
  isFinal$: ReadonlyObservable<boolean>;
  /** Recognized text */
  result$: ReadonlyObservable<string>;
  /** Recognition error */
  error$: ReadonlyObservable<SpeechRecognitionErrorEvent | undefined>;
  /** Start recognition */
  start: () => void;
  /** Stop recognition */
  stop: () => void;
  /** Toggle recognition */
  toggle: (value?: boolean) => void;
}

/*@__NO_SIDE_EFFECTS__*/
export function useSpeechRecognition(
  options?: DeepMaybeObservable<UseSpeechRecognitionOptions>
): UseSpeechRecognitionReturn {
  const opts$ = useMaybeObservable(options, {
    window: "opaque",
  });

  const _window = useConstant(() => opts$.window.peek()) ?? defaultWindow;

  const SpeechRecognitionAPI = useConstant<SpeechRecognitionConstructor | undefined>(() => {
    if (!_window) return undefined;
    const win = _window as WindowWithSpeechRecognition;
    return win.SpeechRecognition ?? win.webkitSpeechRecognition;
  });

  const isSupported$ = useSupported(() => !!SpeechRecognitionAPI);

  const isListening$ = useObservable(false);
  const isFinal$ = useObservable(false);
  const result$ = useObservable("");
  const error$ = useObservable<SpeechRecognitionErrorEvent | undefined>(undefined);

  const recognitionRef = useConstant<{ current: SpeechRecognitionInstance | null }>(() => ({
    current: null,
  }));

  const start = useConstant(() => () => {
    if (!SpeechRecognitionAPI || isListening$.peek()) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = opts$.peek()?.lang ?? "en-US";
    recognition.continuous = opts$.peek()?.continuous ?? true;
    recognition.interimResults = opts$.peek()?.interimResults ?? true;
    recognition.maxAlternatives = opts$.peek()?.maxAlternatives ?? 1;

    recognition.onstart = () => {
      batch(() => {
        isListening$.set(true);
        isFinal$.set(false);
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      if (results.length === 0) return;
      let transcript = "";
      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      batch(() => {
        result$.set(transcript);
        isFinal$.set(results[results.length - 1].isFinal);
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      error$.set(event);
    };

    recognition.onend = () => {
      // isListening$ is also set in stop() as a defensive double-set;
      // Legend-State deduplicates same-value sets so this is harmless.
      isListening$.set(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  });

  const stop = useConstant(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // Defensive set in case onend doesn't fire (e.g. recognition was never started)
    isListening$.set(false);
  });

  const toggle = useConstant(() => (value?: boolean) => {
    const shouldListen = value ?? !isListening$.peek();
    if (shouldListen) {
      start();
    } else {
      stop();
    }
  });

  useMount(() => {
    return () => {
      stop();
    };
  });

  return {
    isSupported$,
    isListening$,
    isFinal$,
    result$,
    error$,
    start,
    stop,
    toggle,
  };
}
