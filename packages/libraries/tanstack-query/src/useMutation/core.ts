import { observable, observe, type Observable } from "@legendapp/state";
import { MutationKey, MutationObserver } from "@tanstack/query-core";
import { QueryClient } from "@tanstack/query-core";
import { type Disposable } from "@usels/core";
import { resolveMutationKey } from "../keyResolvers";

export interface CreateMutationOptions<TData = unknown, TVariables = void, TContext = unknown> {
  mutationKey?: MutationKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => void | Promise<void>;
  onError?: (
    error: Error,
    variables: TVariables,
    context: TContext | undefined
  ) => void | Promise<void>;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void | Promise<void>;
}

export interface MutationState<TData = unknown, TVariables = void, TContext = unknown> {
  data: TData | undefined;
  error: Error | null;
  status: "idle" | "pending" | "error" | "success";
  isIdle: boolean;
  isPending: boolean;
  isPaused: boolean;
  isSuccess: boolean;
  isError: boolean;
  failureCount: number;
  failureReason: Error | null;
  submittedAt: number;
  variables: TVariables | undefined;
  context: TContext | undefined;

  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Core observable function for bridging TanStack Query mutations with Legend-State.
 * Framework-agnostic — no React imports.
 *
 * Creates a MutationObserver and subscribes immediately. Reacts to option
 * changes via `observe()`.
 *
 * @param queryClient - The TanStack QueryClient instance.
 * @param options$ - Observable containing mutation options (callbacks stored as plain functions).
 * @returns Disposable with `state$` Observable reflecting mutation state.
 */
export function createMutation<TData = unknown, TVariables = void, TContext = unknown>(
  queryClient: QueryClient,
  options$: Observable<CreateMutationOptions<TData, TVariables, TContext>>
): Disposable & { state$: Observable<MutationState<TData, TVariables, TContext>> } {
  const subscriptions: (() => void)[] = [];

  // Non-reactive snapshot for initial observer creation
  const initialOpts = options$.peek();

  const observer = new MutationObserver<TData, Error, TVariables, TContext>(queryClient, {
    mutationKey: resolveMutationKey(initialOpts?.mutationKey),
    mutationFn: initialOpts?.mutationFn ?? (() => Promise.resolve(undefined as TData)),
    onMutate: initialOpts?.onMutate,
    onSuccess: initialOpts?.onSuccess,
    onError: initialOpts?.onError,
    onSettled: initialOpts?.onSettled,
  });

  const state$ = observable<MutationState<TData, TVariables, TContext>>({
    data: undefined as TData | undefined,
    error: null as Error | null,
    status: "idle" as "idle" | "pending" | "error" | "success",
    isIdle: true,
    isPending: false,
    isPaused: false,
    isSuccess: false,
    isError: false,
    failureCount: 0,
    failureReason: null as Error | null,
    submittedAt: 0,
    variables: undefined as TVariables | undefined,
    context: undefined as TContext | undefined,
    mutate(variables: TVariables) {
      // Cast to any: TanStack Query mutate() returns void in types but may return
      // a Promise at runtime. Swallow it to prevent unhandled rejection warnings.
      (observer.mutate(variables) as unknown as Promise<void>)?.catch?.(() => {});
    },
    mutateAsync(variables: TVariables): Promise<TData> {
      return new Promise((resolve, reject) => {
        // Suppress TanStack Query's internal execute() Promise rejection.
        (
          observer.mutate(variables, {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error),
          }) as unknown as Promise<void>
        )?.catch?.(() => {});
      });
    },
    reset() {
      observer.reset();
    },
  });

  // React to option changes via observe()
  subscriptions.push(
    observe(() => {
      const opts = options$.get();
      if (!opts) return;

      observer.setOptions({
        mutationKey: resolveMutationKey(opts.mutationKey),
        mutationFn: opts.mutationFn,
        onMutate: opts.onMutate,
        onSuccess: opts.onSuccess,
        onError: opts.onError,
        onSettled: opts.onSettled,
      });
    })
  );

  // Subscribe immediately — updates state$ on every mutation result change.
  subscriptions.push(
    observer.subscribe((result) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      state$.assign({
        data: result.data,
        error: result.error ?? null,
        status: result.status,
        isIdle: result.isIdle,
        isPending: result.isPending,
        isPaused: result.isPaused,
        isSuccess: result.isSuccess,
        isError: result.isError,
        failureCount: result.failureCount,
        failureReason: result.failureReason ?? null,
        submittedAt: result.submittedAt,
        variables: result.variables,
        context: result.context,
      } as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })
  );

  return {
    state$,
    dispose: () => subscriptions.forEach((unsub) => unsub()),
  };
}
