---
title: useMutation
category: Hooks
---

React hook for performing mutations that bridges TanStack Query with Legend-State. Returns mutation state as an `Observable`, so every status field (`isPending`, `isSuccess`, `isError`, etc.) is reactive. Options follow TanStack Query's standard `UseMutationOptions` — refer to [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation) for full option details.

## Demo

## Usage

### Basic mutation

```tsx twoslash
// @noErrors
import { Show } from "@legendapp/state/react";
import { useMutation } from "@usels/tanstack-query";

function CreateUser() {
  const mutation = useMutation({
    mutationFn: (user: { name: string; email: string }) =>
      fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(user),
      }).then((r) => r.json()),
  });

  return (
    <div>
      <button
        onClick={() => mutation.mutate.get()({ name: "John", email: "john@test.com" })}
        disabled={mutation.isPending.get()}
      >
        <Show if={mutation.isPending} else="Create User">
          Creating...
        </Show>
      </button>
      <Show if={mutation.isError}>
        <p>Error: {mutation.error.get()?.message}</p>
      </Show>
      <Show if={mutation.isSuccess}>
        <p>User created!</p>
      </Show>
    </div>
  );
}
```

### With callbacks

```tsx twoslash
// @noErrors
import { useMutation, useQueryClient } from "@usels/tanstack-query";

function AddTodo() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (text: string) =>
      fetch("/api/todos", {
        method: "POST",
        body: JSON.stringify({ text }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return <button onClick={() => mutation.mutate.get()("New todo")}>Add Todo</button>;
}
```

### Async mutation

```tsx twoslash
// @noErrors
import { useMutation } from "@usels/tanstack-query";

function SubmitForm() {
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch("/api/submit", { method: "POST", body: data }).then((r) => r.json()),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await mutation.mutateAsync.get()(new FormData(e.currentTarget));
      console.log("Submitted:", result);
    } catch (error) {
      console.error("Failed:", error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Notes

- **Observable state fields** — All returned fields are `Observable`. Call `.get()` in reactive components, `.peek()` for non-reactive reads (e.g. event handlers).
- **Calling methods** — `mutate`, `mutateAsync`, and `reset` are stored on the Observable. Access them with the `.get()()` pattern: `mutation.mutate.get()(variables)`.
- **Conditional rendering** — Use `<Show if={obs$}>` from `@legendapp/state/react` for conditional JSX, not `{obs.get() && <JSX>}`.
- **Cache invalidation** — Use `onSuccess` callback with `queryClient.invalidateQueries()` to refetch related queries after a successful mutation.
