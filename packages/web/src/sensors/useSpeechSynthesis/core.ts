import { batch, observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  onUnmount,
  peek,
  type DeepMaybeObservable,
  type MaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";

export type UseSpeechSynthesisStatus = "init" | "play" | "pause" | "end";

export interface UseSpeechSynthesisErrorData {
  error: string;
  charIndex: number;
  elapsedTime: number;
}

export interface UseSpeechSynthesisOptions extends ConfigurableWindow {
  /** Language for synthesis. Default: "en-US" */
  lang?: string;
  /** Pitch (0-2). Default: 1 */
  pitch?: number;
  /** Rate (0.1-10). Default: 1 */
  rate?: number;
  /** Volume (0-1). Default: 1 */
  volume?: number;
  /** Voice to use */
  voice?: SpeechSynthesisVoice;
}

export interface UseSpeechSynthesisReturn extends Supportable {
  /** Whether speech is currently playing */
  isPlaying$: ReadonlyObservable<boolean>;
  /** Current status */
  status$: ReadonlyObservable<UseSpeechSynthesisStatus>;
  /** Speech error */
  error$: ReadonlyObservable<UseSpeechSynthesisErrorData | undefined>;
  /** Start speaking the text */
  speak: () => void;
  /** Stop speaking */
  stop: () => void;
  /** Toggle speaking */
  toggle: (value?: boolean) => void;
}

/**
 * Framework-agnostic reactive wrapper around the
 * [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
 *
 * Each `speak()` call constructs a fresh `SpeechSynthesisUtterance` using the
 * latest text and option values. Cleanup (`speechSynthesis.cancel()`) is
 * registered via `onUnmount`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createSpeechSynthesis(
  text: MaybeObservable<string>,
  options?: DeepMaybeObservable<UseSpeechSynthesisOptions>
): UseSpeechSynthesisReturn {
  const text$ = observable(text);
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const isSupported$ = createSupported(() => {
    const win = win$.get();
    return !!(win && "speechSynthesis" in win);
  });

  const isPlaying$ = observable(false);
  const status$ = observable<UseSpeechSynthesisStatus>("init");
  const error$ = observable<UseSpeechSynthesisErrorData | undefined>(undefined);

  const stop = (): void => {
    const win = win$.peek();
    if (win) {
      win.speechSynthesis.cancel();
    }
    isPlaying$.set(false);
  };

  const speak = (): void => {
    const win = win$.peek();
    if (!win || !isSupported$.peek()) return;

    // Cancel any ongoing speech before starting
    win.speechSynthesis.cancel();

    const currentText = text$.peek() ?? "";
    const inst = new SpeechSynthesisUtterance(currentText);
    const raw = opts$.peek();
    inst.lang = (peek(raw?.lang) as string | undefined) ?? "en-US";
    inst.pitch = (peek(raw?.pitch) as number | undefined) ?? 1;
    inst.rate = (peek(raw?.rate) as number | undefined) ?? 1;
    inst.volume = (peek(raw?.volume) as number | undefined) ?? 1;
    const voice = peek(raw?.voice) as SpeechSynthesisVoice | undefined;
    if (voice) {
      inst.voice = voice;
    }

    inst.onstart = () => {
      batch(() => {
        status$.set("play");
        isPlaying$.set(true);
      });
    };

    inst.onpause = () => {
      batch(() => {
        status$.set("pause");
        isPlaying$.set(false);
      });
    };

    inst.onresume = () => {
      batch(() => {
        status$.set("play");
        isPlaying$.set(true);
      });
    };

    inst.onend = () => {
      batch(() => {
        status$.set("end");
        isPlaying$.set(false);
      });
    };

    inst.onerror = (event: SpeechSynthesisErrorEvent) => {
      batch(() => {
        error$.set({
          error: event.error,
          charIndex: event.charIndex,
          elapsedTime: event.elapsedTime,
        });
        status$.set("end");
        isPlaying$.set(false);
      });
    };

    win.speechSynthesis.speak(inst);
  };

  const toggle = (value?: boolean): void => {
    const shouldPlay = value ?? !isPlaying$.peek();
    if (shouldPlay) {
      speak();
    } else {
      stop();
    }
  };

  onUnmount(() => {
    stop();
  });

  return {
    isSupported$,
    isPlaying$: isPlaying$ as ReadonlyObservable<boolean>,
    status$: status$ as ReadonlyObservable<UseSpeechSynthesisStatus>,
    error$: error$ as ReadonlyObservable<UseSpeechSynthesisErrorData | undefined>,
    speak,
    stop,
    toggle,
  };
}
