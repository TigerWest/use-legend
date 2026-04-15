import { MutationKey, MutationObserver } from "@tanstack/query-core";
import {
  observe,
  onUnmount,
  createIsMounted,
  type DeepMaybeObservable,
  Observable,
  observable,
} from "@usels/core";
import { getQueryClient } from "../useQueryClient";
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
 *
 * Must be called inside a scope wrapped by a `QueryClientProvider` —
 * `getQueryClient()` injects the client from context. Teardown is registered
 * via `onUnmount`; option changes propagate via `observe`.
 *
 * @param options - Plain object, per-field Observable, or outer Observable of options.
 * @returns Observable reflecting mutation state (including `mutate`/`mutateAsync`/`reset`).
 */
export function createMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options?: DeepMaybeObservable<CreateMutationOptions<TData, TVariables, TContext>>
): Observable<MutationState<TData, TVariables, TContext>> {
  const queryClient = getQueryClient();
  const opts$ = observable(options) as Observable<
    CreateMutationOptions<TData, TVariables, TContext>
  >;

  const initialOpts = opts$.peek();

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

  const isMounted$ = createIsMounted();
  observe(() => {
    const opts = opts$.get();
    if (!opts || !isMounted$.get()) return;

    observer.setOptions({
      mutationKey: resolveMutationKey(opts.mutationKey),
      mutationFn: opts.mutationFn,
      onMutate: opts.onMutate,
      onSuccess: opts.onSuccess,
      onError: opts.onError,
      onSettled: opts.onSettled,
    });
  });

  const unsubscribe = observer.subscribe((result) => {
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
  });

  onUnmount(unsubscribe);

  return state$;
}
