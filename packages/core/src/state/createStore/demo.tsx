import { batch, observable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { For, Memo, Show, useObservable } from "@legendapp/state/react";
import { createStore, StoreProvider } from ".";
import { ActionButton, DemoPanel, DemoShell, StatusBadge, demoClasses } from "../../shared/_demo";

// --- Types ---

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = "all" | "active" | "done";

// --- Store 1: Todo items ---

const useTodoStore = createStore("todo-demo", () => {
  const todos$ = observable<Todo[]>([]);
  let nextId = 0;

  const add = (text: string) => {
    if (!text.trim()) return;
    todos$.push({ id: nextId++, text: text.trim(), done: false });
  };

  const toggle = (id: number) => {
    const idx = todos$.peek().findIndex((t) => t.id === id);
    if (idx >= 0) todos$[idx].done.set((v) => !v);
  };

  const remove = (id: number) => {
    todos$.find((v) => v.id.peek() === id)?.delete();
  };

  return { todos$, add, toggle, remove };
});

// --- Store 2: Filter (depends on todo store) ---

const useFilterStore = createStore("todo-filter", () => {
  const { todos$ } = useTodoStore(); // inter-store dependency
  const filter$ = observable<Filter>("all");

  const setFilter = (filter: Filter) => filter$.set(filter);

  const clearDone = () => {
    const doneIds = todos$
      .peek()
      .filter((t) => t.done)
      .map((t) => t.id);
    for (const id of doneIds) {
      todos$.find((v) => v.id.peek() === id)?.delete();
    }
  };

  return { filter$, setFilter, clearDone };
});

// --- Components ---

function TodoInput() {
  const input$ = useObservable("");
  const { add } = useTodoStore();

  const handleAdd = () => {
    batch(() => {
      add(input$.peek());
      input$.set("");
    });
  };

  return (
    <div className="flex gap-2">
      <input
        className={demoClasses.input}
        placeholder="What needs to be done?"
        value={input$.get()}
        onChange={(e) => input$.set(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") handleAdd();
        }}
      />
      <ActionButton onClick={handleAdd} tone="accent">
        Add
      </ActionButton>
    </div>
  );
}

function FilterBar() {
  const { filter$, setFilter, clearDone } = useFilterStore();
  const { todos$ } = useTodoStore();

  return (
    <Memo>
      {() => {
        const current = filter$.get();
        const todos = todos$.get();
        const doneCount = todos.filter((t) => t.done).length;
        const filters: Filter[] = ["all", "active", "done"];

        return (
          <div className="flex items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
                  current === f
                    ? "bg-[var(--sl-color-accent)] text-white"
                    : "text-[var(--sl-color-gray-3)] hover:bg-[var(--sl-color-gray-6)]",
                ].join(" ")}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
            {doneCount > 0 && (
              <ActionButton onClick={clearDone} tone="orange">
                Clear done
              </ActionButton>
            )}
          </div>
        );
      }}
    </Memo>
  );
}

function TodoItem({ todo$ }: { todo$: Observable<Todo> }) {
  const { toggle, remove } = useTodoStore();
  const { filter$ } = useFilterStore();

  return (
    <Show
      if={() => {
        const f = filter$.get();
        if (f === "all") return true;
        return f === "done" ? todo$.done.get() : !todo$.done.get();
      }}
    >
      <div
        className={[
          "flex items-center gap-2.5 rounded-[14px] border px-3 py-2.5 transition-colors",
          todo$.done.get()
            ? "border-[var(--sl-color-green)] bg-[var(--sl-color-green-low)]"
            : "border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => toggle(todo$.id.peek())}
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors",
            todo$.done.get()
              ? "border-[var(--sl-color-green)] bg-[var(--sl-color-green)] text-white"
              : "border-[var(--sl-color-gray-4)]",
          ].join(" ")}
        >
          {todo$.done.get() ? "\u2713" : null}
        </button>
        <span
          className={[
            "flex-1 text-[13px]",
            todo$.done.get()
              ? "text-[var(--sl-color-gray-3)] line-through"
              : "font-medium text-[var(--sl-color-text)]",
          ].join(" ")}
        >
          {todo$.text.get()}
        </span>
        <button
          type="button"
          onClick={() => remove(todo$.id.peek())}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[14px] text-[var(--sl-color-gray-3)] transition-colors hover:bg-[var(--sl-color-gray-5)] hover:text-[var(--sl-color-text)]"
        >
          &times;
        </button>
      </div>
    </Show>
  );
}

function TodoApp() {
  const { todos$ } = useTodoStore();

  return (
    <DemoShell eyebrow="Store Pattern">
      <DemoPanel
        title="Tasks"
        aside={
          <Memo>
            {() => {
              const todos = todos$.get();
              const done = todos.filter((t) => t.done).length;
              const total = todos.length;
              return total > 0 ? (
                <StatusBadge
                  label={`${done}/${total} done`}
                  tone={done === total ? "green" : "orange"}
                />
              ) : null;
            }}
          </Memo>
        }
      >
        <TodoInput />
        <FilterBar />
        <Show
          if={() => todos$.get().length > 0}
          else={
            <div className="rounded-[14px] border border-[var(--sl-color-hairline-light)] bg-[var(--sl-color-bg)] px-4 py-4 text-center text-[13px] text-[var(--sl-color-gray-3)]">
              No tasks yet. Add your first task above!
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            <For each={todos$} optimized>
              {}
              {(todo$) => <TodoItem todo$={todo$} />}
            </For>
          </div>
        </Show>
      </DemoPanel>
    </DemoShell>
  );
}

export default function CreateStoreDemo() {
  return (
    <StoreProvider _devtools>
      <TodoApp />
    </StoreProvider>
  );
}
