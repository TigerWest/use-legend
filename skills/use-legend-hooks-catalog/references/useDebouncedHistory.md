# useDebouncedHistory

> Part of `@usels/core` | Category: Reactivity

## Overview

A hook that tracks Observable change history with debounce. A thin wrapper around `useDataHistory` with `debounceFilter` applied — it only records history after typing has stopped. Ideal for text inputs or search fields where you want to snapshot only when a burst of changes has "settled".

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useDebouncedHistory, useObservable } from "@usels/core";

    function Component() {
      const search$ = useObservable("");
      // Record a snapshot 500ms after the user stops typing
      const { undo, redo, canUndo$ } = useDebouncedHistory(search$, { debounce: 500 });

      return <input value={search$.get()} onChange={(e) => search$.set(e.target.value)} />;
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebouncedHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const search$ = observable("");
      const { undo, redo, canUndo$ } = createDebouncedHistory(search$, { debounce: 500 });

      return <input value={search$.get()} onChange={(e) => search$.set(e.target.value)} />;
    }
    ```

  </Fragment>
</CodeTabs>

### maxWait — force commit after maximum delay

Even if the user keeps typing, a snapshot is forced after `maxWait` ms.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useDebouncedHistory, useObservable } from "@usels/core";

    function Component() {
      const text$ = useObservable("");
      // Commit after 500ms idle, or every 2s at most even if still typing
      const { undo, redo } = useDebouncedHistory(text$, {
        debounce: 500,
        maxWait: 2000,
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebouncedHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const text$ = observable("");
      const { undo, redo } = createDebouncedHistory(text$, {
        debounce: 500,
        maxWait: 2000,
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Combined with capacity

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useDebouncedHistory, useObservable } from "@usels/core";

    function Component() {
      const note$ = useObservable("");
      const { undo, redo } = useDebouncedHistory(note$, {
        debounce: 800,
        capacity: 30,
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createDebouncedHistory, observable } from "@usels/core";

    function Component() {
      "use scope"
      const note$ = observable("");
      const { undo, redo } = createDebouncedHistory(note$, {
        debounce: 800,
        capacity: 30,
      });
    }
    ```

  </Fragment>
</CodeTabs>

## Type Declarations

```typescript
export { createDebouncedHistory, type DebouncedHistoryOptions } from "./core";
export type { DataHistoryReturn } from "../useDataHistory/core";
export type UseDebouncedHistory = typeof createDebouncedHistory;
export declare const useDebouncedHistory: UseDebouncedHistory;
```

## Source

- Implementation: `packages/core/src/state/useDebouncedHistory/index.ts`
- Documentation: `packages/core/src/state/useDebouncedHistory/index.mdx`