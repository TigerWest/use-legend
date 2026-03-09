"use client";
import { useUnmount } from "@legendapp/state/react";
import type { Observable } from "@legendapp/state";
import { type DeepMaybeObservable, useMaybeObservable } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { useQueryClient } from "../useQueryClient";
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
 * TanStack Query Mutation과 Legend-App-State를 연결하는 커스텀 훅
 * MutationObserver를 사용하여 뮤테이션 상태를 observable로 관리합니다.
 *
 * @example
 * ```tsx
 * import { QueryClient } from '@tanstack/react-query'
 * import { QueryClientProvider, useMutation } from '@usels/integrations'
 *
 * // QueryClient를 생성하고 Provider로 제공
 * const queryClient = new QueryClient()
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   )
 * }
 *
 * // 컴포넌트에서 사용
 * function YourComponent() {
 *   const createProduct$ = useMutation({
 *     mutationFn: (product: NewProduct) =>
 *       fetch('/api/products', {
 *         method: 'POST',
 *         body: JSON.stringify(product)
 *       }).then(r => r.json()),
 *     onSuccess: () => {
 *       alert('Product created!')
 *     }
 *   })
 *
 *   const handleSubmit = (product: NewProduct) => {
 *     createProduct$.mutate(product)
 *   }
 * }
 * ```
 */
export function useMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: DeepMaybeObservable<CreateMutationOptions<TData, TVariables, TContext>>
): Observable<MutationState<TData, TVariables, TContext>> {
  const queryClient = useQueryClient();

  const opts$ = useMaybeObservable<CreateMutationOptions<TData, TVariables, TContext>>(
    options as DeepMaybeObservable<CreateMutationOptions<TData, TVariables, TContext>>,
    {
      mutationFn: "function",
      onMutate: "function",
      onSuccess: "function",
      onError: "function",
      onSettled: "function",
    }
  );

  const { state$, dispose } = useConstant(() =>
    createMutation<TData, TVariables, TContext>(
      queryClient,

      opts$ as unknown as Observable<CreateMutationOptions<TData, TVariables, TContext>>
    )
  );

  useUnmount(dispose);

  return state$;
}
