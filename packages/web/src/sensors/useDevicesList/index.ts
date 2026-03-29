"use client";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { useMaybeObservable, useInitialPick, useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultNavigator } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";

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

/*@__NO_SIDE_EFFECTS__*/
export function useDevicesList(
  options?: DeepMaybeObservable<UseDevicesListOptions>
): UseDevicesListReturn {
  const opts$ = useMaybeObservable(options, {
    onUpdated: "function",
  });

  const { requestPermissions } = useInitialPick(opts$, {
    requestPermissions: false,
  });

  const isSupported$ = useSupported(
    () =>
      !!defaultNavigator &&
      "mediaDevices" in defaultNavigator &&
      !!defaultNavigator.mediaDevices?.enumerateDevices
  );

  const devices$ = useObservable<MediaDeviceInfo[]>([]);
  const permissionGranted$ = useObservable(false);

  const videoInputs$ = useObservable(() => devices$.get().filter((d) => d.kind === "videoinput"));
  const audioInputs$ = useObservable(() => devices$.get().filter((d) => d.kind === "audioinput"));
  const audioOutputs$ = useObservable(() => devices$.get().filter((d) => d.kind === "audiooutput"));

  const update = useConstant(() => async () => {
    if (!defaultNavigator?.mediaDevices?.enumerateDevices) return;
    const deviceList = await defaultNavigator.mediaDevices.enumerateDevices();
    devices$.set(deviceList);
    opts$.peek()?.onUpdated?.(deviceList);
  });

  const ensurePermissions = useConstant(() => async (): Promise<boolean> => {
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
  });

  useEventListener(defaultNavigator?.mediaDevices as EventTarget, "devicechange", () => {
    update();
  });

  useMount(() => {
    if (!isSupported$.peek()) return;

    if (requestPermissions) {
      ensurePermissions();
    } else {
      update();
    }
  });

  return {
    isSupported$,
    devices$,
    videoInputs$,
    audioInputs$,
    audioOutputs$,
    permissionGranted$,
    ensurePermissions,
  };
}
