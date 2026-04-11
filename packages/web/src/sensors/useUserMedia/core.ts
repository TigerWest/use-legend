import { batch, observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import {
  createSupported,
  onMount,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { defaultNavigator } from "@shared/configurable";

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

/**
 * Framework-agnostic reactive wrapper around
 * [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
 *
 * Exposes the active `MediaStream` as an observable with `start()` / `stop()` /
 * `restart()` controls. Constraints are read at each `start()` call, so
 * reactive updates take effect on the next stream acquisition. Cleanup
 * (stopping all tracks) is registered via `onMount` so it fires on unmount.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createUserMedia(
  options?: DeepMaybeObservable<UseUserMediaOptions>
): UseUserMediaReturn {
  const opts$ = observable(options);

  const isSupported$ = createSupported(() => !!defaultNavigator?.mediaDevices?.getUserMedia);

  const stream$ = observable<OpaqueObject<MediaStream> | null>(null);
  const enabled$ = observable(false);

  const stop = (): void => {
    const currentStream = stream$.peek();
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }
    batch(() => {
      stream$.set(null);
      enabled$.set(false);
    });
  };

  const start = async (): Promise<MediaStream> => {
    if (!isSupported$.peek() || !defaultNavigator?.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia is not supported");
    }

    stop();

    try {
      const constraints = (opts$.peek()?.constraints as MediaStreamConstraints | undefined) ?? {
        audio: false,
        video: true,
      };
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
  };

  const restart = async (): Promise<MediaStream> => {
    stop();
    return start();
  };

  onMount(() => {
    if (opts$.peek()?.immediate) {
      // Swallow rejection from auto-start — callers who care about errors
      // should invoke start() explicitly.
      start().catch(() => {});
    }
    return () => {
      stop();
    };
  });

  return {
    isSupported$,
    stream$: stream$ as ReadonlyObservable<OpaqueObject<MediaStream> | null>,
    enabled$: enabled$ as ReadonlyObservable<boolean>,
    start,
    stop,
    restart,
  };
}
