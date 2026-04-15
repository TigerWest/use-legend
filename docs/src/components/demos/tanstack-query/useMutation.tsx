import { Show, useObservable } from "@usels/core";
import { QueryClient, QueryClientProvider, useMutation } from "@usels/tanstack-query";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "@demos/_shared";

interface Todo {
  id: number;
  text: string;
}

let nextId = 1;

function createTodo(text: string): Promise<Todo> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ id: nextId++, text }), 600);
  });
}

const queryClient = new QueryClient();

function MutationDemo() {
  const input$ = useObservable("");
  const mutation = useMutation({
    mutationFn: (text: string) => createTodo(text),
  });

  const statusLabel$ = useObservable(() =>
    mutation.isPending.get()
      ? "Pending"
      : mutation.isSuccess.get()
        ? "Success"
        : mutation.isError.get()
          ? "Error"
          : "Idle"
  );
  const statusTone$ = useObservable(() =>
    mutation.isPending.get()
      ? ("accent" as const)
      : mutation.isSuccess.get()
        ? ("green" as const)
        : mutation.isError.get()
          ? ("orange" as const)
          : ("neutral" as const)
  );

  const handleSubmit = () => {
    const value = input$.peek().trim();
    if (!value) return;
    mutation.mutate(value);
    input$.set("");
  };

  return (
    <DemoPanel
      title="useMutation"
      description="Submit a todo — observe mutation state transitions."
      aside={<StatusBadge label={statusLabel$.get()} tone={statusTone$.get()} />}
    >
      <div className={demoClasses.actionRow}>
        <input
          className={demoClasses.input}
          value={input$.get()}
          onChange={(e) => input$.set(e.target.value)}
          placeholder="Enter todo text..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={mutation.isPending.get()}
        />
      </div>

      <div className={demoClasses.actionRow}>
        <ActionButton
          onClick={handleSubmit}
          tone="accent"
          grow
          disabled={mutation.isPending.get() || !input$.get().trim()}
        >
          <Show if={mutation.isPending} else="Create Todo">
            Creating...
          </Show>
        </ActionButton>
        <ActionButton
          onClick={() => mutation.reset()}
          tone="neutral"
          disabled={mutation.isIdle.get() || mutation.isPending.get()}
        >
          Reset
        </ActionButton>
      </div>

      <Show if={mutation.isSuccess}>
        <div className={demoClasses.valueRow}>
          <span>
            Created: #{mutation.data.get()?.id} — {mutation.data.get()?.text}
          </span>
        </div>
      </Show>
    </DemoPanel>
  );
}

export default function UseMutationDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoShell eyebrow="TanStack Query">
        <MutationDemo />
      </DemoShell>
    </QueryClientProvider>
  );
}
