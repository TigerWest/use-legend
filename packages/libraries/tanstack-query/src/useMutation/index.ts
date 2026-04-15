"use client";
import { useScope, toObs, type DeepMaybeObservable, Observable } from "@usels/core";
import { createMutation, type CreateMutationOptions, type MutationState } from "./core";

export type { CreateMutationOptions, MutationState } from "./core";
export { createMutation } from "./core";

/**
 * UseMutationOptions is an alias for CreateMutationOptions for backward compatibility.
 */
export type UseMutationOptions<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
> = CreateMutationOptions<TData, TVariables, TContext>;

/**
 * Connects TanStack Query Mutation with Legend-State observables.
 * Uses MutationObserver to manage mutation state as observables.
 */
export type UseMutation = typeof createMutation;

export const useMutation: UseMutation = <TData = unknown, TVariables = void, TContext = unknown>(
  options?: DeepMaybeObservable<CreateMutationOptions<TData, TVariables, TContext>>
): Observable<MutationState<TData, TVariables, TContext>> => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        mutationFn: "function",
        onMutate: "function",
        onSuccess: "function",
        onError: "function",
        onSettled: "function",
      }) as unknown as Observable<CreateMutationOptions<TData, TVariables, TContext>>;
      return createMutation<TData, TVariables, TContext>(opts$);
    },
    (options ?? {}) as Record<string, unknown>
  ) as Observable<MutationState<TData, TVariables, TContext>>;
};
