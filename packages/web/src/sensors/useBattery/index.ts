"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { batch } from "@legendapp/state";
import { type ConfigurableNavigator, defaultNavigator } from "@shared/configurable";

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

type NavigatorWithBattery = Navigator & {
  getBattery: () => Promise<BatteryManager>;
};

export type UseBatteryOptions = ConfigurableNavigator;

export interface UseBatteryReturn extends Supportable {
  /** Whether the battery is charging */
  charging$: ReadonlyObservable<boolean>;
  /** Time in seconds until the battery is fully charged */
  chargingTime$: ReadonlyObservable<number>;
  /** Time in seconds until the battery is fully discharged */
  dischargingTime$: ReadonlyObservable<number>;
  /** Battery level (0 to 1) */
  level$: ReadonlyObservable<number>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useBattery(options?: UseBatteryOptions): UseBatteryReturn {
  const nav = options?.navigator ?? defaultNavigator;

  const isSupported$ = useSupported(
    () =>
      !!nav && "getBattery" in nav && typeof (nav as NavigatorWithBattery).getBattery === "function"
  );

  const charging$ = useObservable(false);
  const chargingTime$ = useObservable(0);
  const dischargingTime$ = useObservable(0);
  const level$ = useObservable(1);

  useMount(() => {
    if (!isSupported$.peek()) return;

    let disposed = false;
    let battery: BatteryManager | null = null;
    const events = ["chargingchange", "chargingtimechange", "dischargingtimechange", "levelchange"];

    const updateBatteryInfo = () => {
      if (!battery) return;
      batch(() => {
        charging$.set(battery!.charging);
        chargingTime$.set(battery!.chargingTime || 0);
        dischargingTime$.set(battery!.dischargingTime || 0);
        level$.set(battery!.level);
      });
    };

    (nav as NavigatorWithBattery).getBattery().then((_battery) => {
      if (disposed) return;
      battery = _battery;
      updateBatteryInfo();
      for (const event of events) {
        battery.addEventListener(event, updateBatteryInfo);
      }
    });

    return () => {
      disposed = true;
      if (battery) {
        for (const event of events) {
          battery.removeEventListener(event, updateBatteryInfo);
        }
      }
    };
  });

  return {
    isSupported$,
    charging$,
    chargingTime$,
    dischargingTime$,
    level$,
  };
}
