import { batch, observable } from "@legendapp/state";
import { createSupported, onMount } from "@usels/core";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { defaultNavigator } from "@shared/configurable";

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

type NavigatorWithBattery = Navigator & {
  getBattery: () => Promise<BatteryManager>;
};

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

const BATTERY_EVENTS = [
  "chargingchange",
  "chargingtimechange",
  "dischargingtimechange",
  "levelchange",
] as const;

/**
 * Framework-agnostic reactive battery status.
 *
 * Resolves `navigator.getBattery()` lazily inside `onMount` and syncs
 * `charging` / `chargingTime` / `dischargingTime` / `level` observables
 * with the `BatteryManager` instance. Listeners are torn down on unmount.
 *
 * SSR-safe: falls back to defaults (`charging=false`, `level=1`) when
 * `navigator` or `getBattery` is unavailable.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createBattery(): UseBatteryReturn {
  const isSupported$ = createSupported(
    () =>
      !!defaultNavigator &&
      "getBattery" in defaultNavigator &&
      typeof (defaultNavigator as NavigatorWithBattery).getBattery === "function"
  );

  const charging$ = observable(false);
  const chargingTime$ = observable(0);
  const dischargingTime$ = observable(0);
  const level$ = observable(1);

  onMount(() => {
    if (!isSupported$.peek()) return;

    let disposed = false;
    let battery: BatteryManager | null = null;

    const updateBatteryInfo = () => {
      if (!battery) return;
      batch(() => {
        charging$.set(battery!.charging);
        chargingTime$.set(battery!.chargingTime || 0);
        dischargingTime$.set(battery!.dischargingTime || 0);
        level$.set(battery!.level);
      });
    };

    (defaultNavigator as NavigatorWithBattery).getBattery().then((_battery) => {
      if (disposed) return;
      battery = _battery;
      updateBatteryInfo();
      for (const event of BATTERY_EVENTS) {
        battery.addEventListener(event, updateBatteryInfo);
      }
    });

    return () => {
      disposed = true;
      if (battery) {
        for (const event of BATTERY_EVENTS) {
          battery.removeEventListener(event, updateBatteryInfo);
        }
      }
    };
  });

  return {
    isSupported$,
    charging$: charging$ as ReadonlyObservable<boolean>,
    chargingTime$: chargingTime$ as ReadonlyObservable<number>,
    dischargingTime$: dischargingTime$ as ReadonlyObservable<number>,
    level$: level$ as ReadonlyObservable<number>,
  };
}
