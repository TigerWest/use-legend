"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultWindow, defaultNavigator } from "@usels/core/shared/configurable";
import { useEventListener } from "@browser/useEventListener";

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
export function useNetwork(): UseNetworkReturn {
  const isSupported$ = useSupported(() => !!defaultNavigator && "connection" in defaultNavigator);

  const isOnline$ = useObservable(true);
  const offlineAt$ = useObservable<number | undefined>(undefined);
  const onlineAt$ = useObservable<number | undefined>(undefined);
  const downlink$ = useObservable<number | undefined>(undefined);
  const downlinkMax$ = useObservable<number | undefined>(undefined);
  const effectiveType$ = useObservable<NetworkEffectiveType | undefined>(undefined);
  const rtt$ = useObservable<number | undefined>(undefined);
  const saveData$ = useObservable<boolean | undefined>(undefined);
  const type$ = useObservable<NetworkType>("unknown");

  const updateConnectionInfo = useConstant(() => () => {
    if (!defaultNavigator || !("connection" in defaultNavigator)) return;
    const conn = (defaultNavigator as { connection?: NetworkInformation }).connection;
    if (!conn) return;
    downlink$.set(conn.downlink);
    downlinkMax$.set(conn.downlinkMax);
    effectiveType$.set(conn.effectiveType);
    rtt$.set(conn.rtt);
    saveData$.set(conn.saveData);
    type$.set(conn.type ?? "unknown");
  });

  useMount(() => {
    if (!defaultWindow) return;
    isOnline$.set(defaultNavigator?.onLine ?? true);
    updateConnectionInfo();

    // connection "change" event — manual registration since connection is not window/document
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

  useEventListener(
    "online",
    () => {
      isOnline$.set(true);
      onlineAt$.set(Date.now());
      offlineAt$.set(undefined);
      updateConnectionInfo();
    },
    { passive: true }
  );

  useEventListener(
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
