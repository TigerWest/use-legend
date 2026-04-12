import {
  createSupported,
  onMount,
  observable,
  type DeepMaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { defaultNavigator } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UseDevicesListOptions {
  /** Request permissions on mount */
  requestPermissions?: boolean;
  /** Constraints for getUserMedia when requesting permissions */
  constraints?: MediaStreamConstraints;
  /** Callback when device list is updated */
  onUpdated?: (devices: MediaDeviceInfo[]) => void;
}

export interface UseDevicesListReturn extends Supportable {
  /** All enumerated media devices */
  devices$: ReadonlyObservable<MediaDeviceInfo[]>;
  /** Video input devices (cameras) */
  videoInputs$: ReadonlyObservable<MediaDeviceInfo[]>;
  /** Audio input devices (microphones) */
  audioInputs$: ReadonlyObservable<MediaDeviceInfo[]>;
  /** Audio output devices (speakers) */
  audioOutputs$: ReadonlyObservable<MediaDeviceInfo[]>;
  /** Whether media permissions have been granted */
  permissionGranted$: ReadonlyObservable<boolean>;
  /** Request media device permissions */
  ensurePermissions: () => Promise<boolean>;
}

/**
 * Framework-agnostic reactive wrapper around
 * [MediaDevices.enumerateDevices()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices).
 *
 * Lists available media input/output devices and tracks changes via the
 * `devicechange` event on `navigator.mediaDevices`. Optionally requests
 * permissions on mount.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createDevicesList(
  options?: DeepMaybeObservable<UseDevicesListOptions>
): UseDevicesListReturn {
  const opts$ = observable(options);

  const isSupported$ = createSupported(
    () =>
      !!defaultNavigator &&
      "mediaDevices" in defaultNavigator &&
      !!defaultNavigator.mediaDevices?.enumerateDevices
  );

  const devices$ = observable<MediaDeviceInfo[]>([]);
  const permissionGranted$ = observable(false);

  const videoInputs$ = observable(() => devices$.get().filter((d) => d.kind === "videoinput"));
  const audioInputs$ = observable(() => devices$.get().filter((d) => d.kind === "audioinput"));
  const audioOutputs$ = observable(() => devices$.get().filter((d) => d.kind === "audiooutput"));

  const update = async () => {
    if (!defaultNavigator?.mediaDevices?.enumerateDevices) return;
    const deviceList = await defaultNavigator.mediaDevices.enumerateDevices();
    devices$.set(deviceList);
    opts$.peek()?.onUpdated?.(deviceList);
  };

  const ensurePermissions = async (): Promise<boolean> => {
    if (!isSupported$.peek()) return false;
    if (permissionGranted$.peek()) return true;

    try {
      const constraints = opts$.peek()?.constraints ?? { audio: true, video: true };
      const stream = await defaultNavigator!.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
      permissionGranted$.set(true);
      await update();
      return true;
    } catch {
      return false;
    }
  };

  createEventListener(defaultNavigator?.mediaDevices as EventTarget, "devicechange", () => {
    update();
  });

  onMount(() => {
    if (!isSupported$.peek()) return;

    const requestPermissions = opts$.peek()?.requestPermissions ?? false;
    if (requestPermissions) {
      ensurePermissions();
    } else {
      update();
    }
  });

  return {
    isSupported$,
    devices$: devices$ as ReadonlyObservable<MediaDeviceInfo[]>,
    videoInputs$: videoInputs$ as ReadonlyObservable<MediaDeviceInfo[]>,
    audioInputs$: audioInputs$ as ReadonlyObservable<MediaDeviceInfo[]>,
    audioOutputs$: audioOutputs$ as ReadonlyObservable<MediaDeviceInfo[]>,
    permissionGranted$: permissionGranted$ as ReadonlyObservable<boolean>,
    ensurePermissions,
  };
}
