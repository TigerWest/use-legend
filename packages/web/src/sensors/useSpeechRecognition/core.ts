import { batch, observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  onUnmount,
  peek,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";

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

/**
 * Framework-agnostic reactive wrapper around the
 * [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
 *
 * Each `start()` call instantiates a fresh `SpeechRecognition` object using the
 * latest option values, so reactive option updates take effect on the next
 * `start()` without needing to recreate the hook. Cleanup is registered via
 * `onUnmount`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createSpeechRecognition(
  options?: DeepMaybeObservable<UseSpeechRecognitionOptions>
): UseSpeechRecognitionReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const resolveCtor = (): SpeechRecognitionConstructor | undefined => {
    const win = win$.peek() as WindowWithSpeechRecognition | null;
    if (!win) return undefined;
    return win.SpeechRecognition ?? win.webkitSpeechRecognition;
  };

  const isSupported$ = createSupported(() => {
    const win = win$.get() as WindowWithSpeechRecognition | null;
    if (!win) return false;
    return !!(win.SpeechRecognition ?? win.webkitSpeechRecognition);
  });

  const isListening$ = observable(false);
  const isFinal$ = observable(false);
  const result$ = observable("");
  const error$ = observable<SpeechRecognitionErrorEvent | undefined>(undefined);

  let recognition: SpeechRecognitionInstance | null = null;

  const start = (): void => {
    if (isListening$.peek()) return;
    const Ctor = resolveCtor();
    if (!Ctor) return;

    const raw = opts$.peek();
    const inst = new Ctor();
    inst.lang = (peek(raw?.lang) as string | undefined) ?? "en-US";
    inst.continuous = (peek(raw?.continuous) as boolean | undefined) ?? true;
    inst.interimResults = (peek(raw?.interimResults) as boolean | undefined) ?? true;
    inst.maxAlternatives = (peek(raw?.maxAlternatives) as number | undefined) ?? 1;

    inst.onstart = () => {
      batch(() => {
        isListening$.set(true);
        isFinal$.set(false);
      });
    };

    inst.onresult = (event: SpeechRecognitionEvent) => {
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

    inst.onerror = (event: SpeechRecognitionErrorEvent) => {
      error$.set(event);
    };

    inst.onend = () => {
      // isListening$ is also set in stop() as a defensive double-set;
      // Legend-State deduplicates same-value sets so this is harmless.
      isListening$.set(false);
    };

    recognition = inst;
    inst.start();
  };

  const stop = (): void => {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    // Defensive set in case onend doesn't fire (e.g. recognition was never started)
    isListening$.set(false);
  };

  const toggle = (value?: boolean): void => {
    const shouldListen = value ?? !isListening$.peek();
    if (shouldListen) {
      start();
    } else {
      stop();
    }
  };

  onUnmount(() => {
    stop();
  });

  return {
    isSupported$,
    isListening$: isListening$ as ReadonlyObservable<boolean>,
    isFinal$: isFinal$ as ReadonlyObservable<boolean>,
    result$: result$ as ReadonlyObservable<string>,
    error$: error$ as ReadonlyObservable<SpeechRecognitionErrorEvent | undefined>,
    start,
    stop,
    toggle,
  };
}
