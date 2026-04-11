"use client";
import { useScope } from "@usels/core";
import { createBattery } from "./core";

export { createBattery } from "./core";
export type { UseBatteryReturn } from "./core";

export type UseBattery = typeof createBattery;
export const useBattery: UseBattery = () => {
  return useScope(() => createBattery());
};
