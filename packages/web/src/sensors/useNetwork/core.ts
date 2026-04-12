import { observable } from "@legendapp/state";
import { createSupported, onMount } from "@usels/core";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { type ConfigurableWindow, defaultNavigator, defaultWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export type NetworkType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "none"
  | "wifi"
  | "wimax"
  | "other"
  | "unknown";

export type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseNetworkOptions extends ConfigurableWindow {}

export interface UseNetworkReturn extends Supportable {
  /** Whether the browser is online */
  isOnline$: ReadonlyObservable<boolean>;
  /** Timestamp of last offline transition */
  offlineAt$: ReadonlyObservable<number | undefined>;
  /** Timestamp of last online transition */
  onlineAt$: ReadonlyObservable<number | undefined>;
  /** Downlink speed in Mbps */
  downlink$: ReadonlyObservable<number | undefined>;
  /** Max reachable downlink speed in Mbps */
  downlinkMax$: ReadonlyObservable<number | undefined>;
  /** Effective connection type */
  effectiveType$: ReadonlyObservable<NetworkEffectiveType | undefined>;
  /** Estimated round-trip time in ms */
  rtt$: ReadonlyObservable<number | undefined>;
  /** Whether data-saver mode is active */
  saveData$: ReadonlyObservable<boolean | undefined>;
  /** Connection type */
  type$: ReadonlyObservable<NetworkType>;
}

interface NetworkInformation extends EventTarget {
  readonly downlink?: number;
  readonly downlinkMax?: number;
  readonly effectiveType?: NetworkEffectiveType;
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: NetworkType;
}

/*@__NO_SIDE_EFFECTS__*/
export function createNetwork(_options?: DeepMaybeObservable<UseNetworkOptions>): UseNetworkReturn {
  const isSupported$ = createSupported(
    () => !!defaultNavigator && "connection" in defaultNavigator
  );

  const isOnline$ = observable(true);
  const offlineAt$ = observable<number | undefined>(undefined);
  const onlineAt$ = observable<number | undefined>(undefined);
  const downlink$ = observable<number | undefined>(undefined);
  const downlinkMax$ = observable<number | undefined>(undefined);
  const effectiveType$ = observable<NetworkEffectiveType | undefined>(undefined);
  const rtt$ = observable<number | undefined>(undefined);
  const saveData$ = observable<boolean | undefined>(undefined);
  const type$ = observable<NetworkType>("unknown");

  const updateConnectionInfo = () => {
    if (!defaultNavigator || !("connection" in defaultNavigator)) return;
    const conn = (defaultNavigator as { connection?: NetworkInformation }).connection;
    if (!conn) return;
    downlink$.set(conn.downlink);
    downlinkMax$.set(conn.downlinkMax);
    effectiveType$.set(conn.effectiveType);
    rtt$.set(conn.rtt);
    saveData$.set(conn.saveData);
    type$.set(conn.type ?? "unknown");
  };

  onMount(() => {
    if (!defaultWindow) return;
    isOnline$.set(defaultNavigator?.onLine ?? true);
    updateConnectionInfo();

    const conn =
      isSupported$.peek() && defaultNavigator
        ? ((defaultNavigator as { connection?: NetworkInformation }).connection ?? null)
        : null;
    if (conn) {
      conn.addEventListener("change", updateConnectionInfo);
    }
    return () => {
      if (conn) {
        conn.removeEventListener("change", updateConnectionInfo);
      }
    };
  });

  createEventListener(
    (defaultWindow as MaybeEventTarget) ?? null,
    "online",
    () => {
      isOnline$.set(true);
      onlineAt$.set(Date.now());
      offlineAt$.set(undefined);
      updateConnectionInfo();
    },
    { passive: true }
  );

  createEventListener(
    (defaultWindow as MaybeEventTarget) ?? null,
    "offline",
    () => {
      isOnline$.set(false);
      offlineAt$.set(Date.now());
      onlineAt$.set(undefined);
      updateConnectionInfo();
    },
    { passive: true }
  );

  return {
    isSupported$,
    isOnline$,
    offlineAt$,
    onlineAt$,
    downlink$,
    downlinkMax$,
    effectiveType$,
    rtt$,
    saveData$,
    type$,
  };
}
