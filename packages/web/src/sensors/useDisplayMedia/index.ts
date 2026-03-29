"use client";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { useMaybeObservable, useInitialPick, useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { ObservableHint, batch } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultNavigator } from "@shared/configurable";

export interface UseDisplayMediaOptions {
  /** Video constraint. Default: true */
  video?: boolean | MediaTrackConstraints;
  /** Audio constraint. Default: false */
  audio?: boolean | MediaTrackConstraints;
  /** Auto-start on mount. Default: false */
  immediate?: boolean;
}

export interface UseDisplayMediaReturn extends Supportable {
  /** Current display media stream */
  stream$: ReadonlyObservable<OpaqueObject<MediaStream> | null>;
  /** Whether stream is currently active */
  enabled$: ReadonlyObservable<boolean>;
  /** Start screen sharing. Throws if getDisplayMedia fails. */
  start: () => Promise<MediaStream>;
  /** Stop screen sharing */
  stop: () => void;
}

/*@__NO_SIDE_EFFECTS__*/
export function useDisplayMedia(
  options?: DeepMaybeObservable<UseDisplayMediaOptions>
): UseDisplayMediaReturn {
  const opts$ = useMaybeObservable(options);

  const { immediate } = useInitialPick(opts$, { immediate: false });

  const isSupported$ = useSupported(() => !!defaultNavigator?.mediaDevices?.getDisplayMedia);

  const stream$ = useObservable<OpaqueObject<MediaStream> | null>(null);
  const enabled$ = useObservable(false);

  const _stop = useConstant(() => () => {
    const currentStream = stream$.peek();
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }
    batch(() => {
      stream$.set(null);
      enabled$.set(false);
    });
  });

  const _start = useConstant(() => async (): Promise<MediaStream> => {
    if (!isSupported$.peek() || !defaultNavigator?.mediaDevices?.getDisplayMedia) {
      throw new Error("getDisplayMedia is not supported");
    }
    const existing = stream$.peek();
    if (existing) return existing;

    _stop();

    try {
      const video = opts$.peek()?.video ?? true;
      const audio = opts$.peek()?.audio ?? false;

      const mediaStream = await defaultNavigator!.mediaDevices.getDisplayMedia({
        video,
        audio,
      });

      // Listen for track ended (user clicks browser's "Stop sharing")
      mediaStream.getTracks().forEach((track) => {
        track.addEventListener("ended", _stop, { once: true });
      });

      batch(() => {
        stream$.set(ObservableHint.opaque(mediaStream));
        enabled$.set(true);
      });
      return mediaStream;
    } catch (err) {
      batch(() => {
        stream$.set(null);
        enabled$.set(false);
      });
      throw err;
    }
  });

  const start = useConstant(() => _start);
  const stop = useConstant(() => _stop);

  useMount(() => {
    if (immediate) {
      _start();
    }
    return () => {
      _stop();
    };
  });

  return {
    isSupported$,
    stream$,
    enabled$,
    start,
    stop,
  };
}
