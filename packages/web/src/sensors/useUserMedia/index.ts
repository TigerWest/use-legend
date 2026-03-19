"use client";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { useMaybeObservable, useInitialPick, useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { ObservableHint, batch } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultNavigator } from "@usels/core/shared/configurable";

export interface UseUserMediaOptions {
  /** Media constraints for getUserMedia. Default: { audio: false, video: true } */
  constraints?: MediaStreamConstraints;
  /** Auto-start stream on mount. Default: false */
  immediate?: boolean;
}

export interface UseUserMediaReturn extends Supportable {
  /** Current media stream */
  stream$: ReadonlyObservable<OpaqueObject<MediaStream> | null>;
  /** Whether stream is currently active */
  enabled$: ReadonlyObservable<boolean>;
  /** Start the media stream. Throws if getUserMedia fails. */
  start: () => Promise<MediaStream>;
  /** Stop the media stream */
  stop: () => void;
  /** Restart the media stream. Throws if getUserMedia fails. */
  restart: () => Promise<MediaStream>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useUserMedia(
  options?: DeepMaybeObservable<UseUserMediaOptions>
): UseUserMediaReturn {
  const opts$ = useMaybeObservable(options);

  const { immediate } = useInitialPick(opts$, { immediate: false });

  const isSupported$ = useSupported(() => !!defaultNavigator?.mediaDevices?.getUserMedia);

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
    if (!isSupported$.peek() || !defaultNavigator?.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia is not supported");
    }

    _stop();

    try {
      const constraints = opts$.peek()?.constraints ?? { audio: false, video: true };
      const mediaStream = await defaultNavigator.mediaDevices.getUserMedia(constraints);
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
  const restart = useConstant(() => async (): Promise<MediaStream> => {
    _stop();
    return _start();
  });

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
    restart,
  };
}
