"use client";
import { useScope } from "@usels/core";
import { createNetwork } from "./core";

export { createNetwork } from "./core";
export type {
  NetworkType,
  NetworkEffectiveType,
  UseNetworkOptions,
  UseNetworkReturn,
} from "./core";

export type UseNetwork = typeof createNetwork;
export const useNetwork: UseNetwork = (options = {}) => {
  return useScope(() => createNetwork(options));
};
