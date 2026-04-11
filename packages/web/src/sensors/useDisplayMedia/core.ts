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

/**
 * Framework-agnostic reactive wrapper around
 * [MediaDevices.getDisplayMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia).
 *
 * Provides start/stop controls and automatically handles the browser's
 * "Stop sharing" button via a per-track `ended` listener.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createDisplayMedia(
  options?: DeepMaybeObservable<UseDisplayMediaOptions>
): UseDisplayMediaReturn {
  const opts$ = observable(options);

  const isSupported$ = createSupported(() => !!defaultNavigator?.mediaDevices?.getDisplayMedia);

  const stream$ = observable<OpaqueObject<MediaStream> | null>(null);
  const enabled$ = observable(false);

  const stop = () => {
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
    if (!isSupported$.peek() || !defaultNavigator?.mediaDevices?.getDisplayMedia) {
      throw new Error("getDisplayMedia is not supported");
    }
    const existing = stream$.peek();
    if (existing) return existing;

    stop();

    try {
      const video = opts$.peek()?.video ?? true;
      const audio = opts$.peek()?.audio ?? false;

      const mediaStream = await defaultNavigator.mediaDevices.getDisplayMedia({
        video,
        audio,
      });

      // Listen for track ended (user clicks browser's "Stop sharing")
      mediaStream.getTracks().forEach((track) => {
        track.addEventListener("ended", stop, { once: true });
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
  };

  onMount(() => {
    if (opts$.peek()?.immediate) {
      start();
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
  };
}
