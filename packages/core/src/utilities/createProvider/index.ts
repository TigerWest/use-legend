"use client";

import React from "react";

export interface CreateProviderOptions {
  name?: string;
  strict?: boolean;
}

export type CreateProviderReturn<Props, Value> = readonly [
  Provider: React.FC<React.PropsWithChildren<Props>>,
  useContext: () => Value,
];

export type CreateProviderNullableReturn<Props, Value> = readonly [
  Provider: React.FC<React.PropsWithChildren<Props>>,
  useContext: () => Value | undefined,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Props must accept arbitrary key-value pairs
export function createProvider<Props extends Record<string, any>, Value>(
  composable: (props: Props) => Value,
  options?: CreateProviderOptions & { strict?: true }
): CreateProviderReturn<Props, Value>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Props must accept arbitrary key-value pairs
export function createProvider<Props extends Record<string, any>, Value>(
  composable: (props: Props) => Value,
  options: CreateProviderOptions & { strict: false }
): CreateProviderNullableReturn<Props, Value>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Props must accept arbitrary key-value pairs
export function createProvider<Props extends Record<string, any>, Value>(
  composable: (props: Props) => Value,
  options?: CreateProviderOptions
): CreateProviderReturn<Props, Value> | CreateProviderNullableReturn<Props, Value> {
  const strict = options?.strict !== false;
  const Context = React.createContext<Value | undefined>(undefined);
  Context.displayName = options?.name ?? composable.name ?? "CreateProvider";

  const Provider: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const { children, ...rest } = props as React.PropsWithChildren<Props>;
    const value = composable(rest as unknown as Props);
    return React.createElement(Context.Provider, { value }, children);
  };

  const useCtx = (): Value | undefined => {
    const ctx = React.useContext(Context);
    if (strict && ctx === undefined) {
      throw new Error(`${Context.displayName}: useContext must be used within a Provider.`);
    }
    return ctx;
  };

  return [Provider, useCtx] as const;
}
