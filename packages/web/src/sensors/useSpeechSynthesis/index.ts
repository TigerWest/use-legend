"use client";
import type {
  DeepMaybeObservable,
  MaybeObservable,
  ReadonlyObservable,
  Supportable,
} from "@usels/core";
import { useMaybeObservable, useSupported } from "@usels/core";
import { batch } from "@legendapp/state";
import { useObservable, useMount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultWindow, type ConfigurableWindow } from "@usels/core/shared/configurable";

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

/*@__NO_SIDE_EFFECTS__*/
export function useSpeechSynthesis(
  text: MaybeObservable<string>,
  options?: DeepMaybeObservable<UseSpeechSynthesisOptions>
): UseSpeechSynthesisReturn {
  const text$ = useMaybeObservable(text);
  const opts$ = useMaybeObservable(options, {
    voice: "opaque",
    window: "opaque",
  });

  const _window = useConstant(() => opts$.window.peek()) ?? defaultWindow;

  const isSupported$ = useSupported(() => !!(_window && "speechSynthesis" in _window));

  const isPlaying$ = useObservable(false);
  const status$ = useObservable<UseSpeechSynthesisStatus>("init");
  const error$ = useObservable<UseSpeechSynthesisErrorData | undefined>(undefined);

  const utteranceRef = useConstant<{ current: SpeechSynthesisUtterance | null }>(() => ({
    current: null,
  }));

  const stop = useConstant(() => () => {
    if (_window) {
      _window.speechSynthesis.cancel();
    }
    isPlaying$.set(false);
  });

  const speak = useConstant(() => () => {
    if (!_window || !isSupported$.peek()) return;

    // Cancel any ongoing speech before starting
    _window.speechSynthesis.cancel();

    const currentText = text$.peek() ?? "";
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.lang = opts$.peek()?.lang ?? "en-US";
    utterance.pitch = opts$.peek()?.pitch ?? 1;
    utterance.rate = opts$.peek()?.rate ?? 1;
    utterance.volume = opts$.peek()?.volume ?? 1;
    const voice = opts$.peek()?.voice;
    if (voice) {
      utterance.voice = voice as SpeechSynthesisVoice;
    }

    utterance.onstart = () => {
      batch(() => {
        status$.set("play");
        isPlaying$.set(true);
      });
    };

    utterance.onpause = () => {
      batch(() => {
        status$.set("pause");
        isPlaying$.set(false);
      });
    };

    utterance.onresume = () => {
      batch(() => {
        status$.set("play");
        isPlaying$.set(true);
      });
    };

    utterance.onend = () => {
      batch(() => {
        status$.set("end");
        isPlaying$.set(false);
      });
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
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

    utteranceRef.current = utterance;
    _window.speechSynthesis.speak(utterance);
  });

  const toggle = useConstant(() => (value?: boolean) => {
    const shouldPlay = value ?? !isPlaying$.peek();
    if (shouldPlay) {
      speak();
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
    isPlaying$,
    status$,
    error$,
    speak,
    stop,
    toggle,
  };
}
