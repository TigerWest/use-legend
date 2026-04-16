# useTimeAgo

> Part of `@usels/core` | Category: Timer

## Overview

Reactive human-readable time-ago string that auto-updates (powered by date-fns)

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
        import { useTimeAgo } from "@usels/core";

    function Component() {
      const timeAgo = useTimeAgo(new Date("2024-01-01"));
      return <div>{timeAgo.get()}</div>;
      // timeAgo.get() → "about 3 months ago"
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";

    function Component() {
      "use scope"
      const timeAgo = createTimeAgo(new Date("2024-01-01"));
      return <div>{timeAgo.get()}</div>;
      // timeAgo.get() → "about 3 months ago"
    }
    ```

  </Fragment>
</CodeTabs>

### Reactive `time`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { observable, useTimeAgo } from "@usels/core";

    function Component() {
      const time$ = observable(new Date());
      const timeAgo = useTimeAgo(time$);

      // time$.set(new Date("2020-01-01")) → "about 4 years ago"
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo, observable } from "@usels/core";

    function Component() {
      "use scope"
      const time$ = observable(new Date());
      const timeAgo = createTimeAgo(time$);

      // time$.set(new Date("2020-01-01")) → "about 4 years ago"
    }
    ```

  </Fragment>
</CodeTabs>

### With pause/resume controls

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeAgo } from "@usels/core";

    function Component() {
      const { timeAgo$, isActive$, pause, resume } = useTimeAgo(new Date(), {
        controls: true,
      });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";

    function Component() {
      "use scope"
      const { timeAgo$, isActive$, pause, resume } = createTimeAgo(new Date(), {
        controls: true,
      });
    }
    ```

  </Fragment>
</CodeTabs>

### Custom update interval

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeAgo } from "@usels/core";

    function Component() {
      // Update every 10 seconds instead of every 30
      const timeAgo = useTimeAgo(new Date(), { updateInterval: 10_000 });
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";

    function Component() {
      "use scope"
      // Update every 10 seconds instead of every 30
      const timeAgo = createTimeAgo(new Date(), { updateInterval: 10_000 });
    }
    ```

  </Fragment>
</CodeTabs>

### Show seconds

When `showSecond: true`, times under 1 minute are shown in detail (maps to date-fns `includeSeconds`).
When `showSecond: false` (default), times within 45 s show `"just now"`.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeAgo } from "@usels/core";

    function Component() {
      const timeAgo = useTimeAgo(new Date(Date.now() - 30_000), { showSecond: true });
      // → "half a minute ago"
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";

    function Component() {
      "use scope"
      const timeAgo = createTimeAgo(new Date(Date.now() - 30_000), { showSecond: true });
      // → "half a minute ago"
    }
    ```

  </Fragment>
</CodeTabs>

### Limit with `max`

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeAgo } from "@usels/core";

    function Component() {
      const timeAgo = useTimeAgo(new Date("2020-01-01"), {
        max: "month",
        fullDateFormatter: (d) => d.toLocaleDateString(),
      });
      // dates older than ~11 months → formatted date string
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";

    function Component() {
      "use scope"
      const timeAgo = createTimeAgo(new Date("2020-01-01"), {
        max: "month",
        fullDateFormatter: (d) => d.toLocaleDateString(),
      });
      // dates older than ~11 months → formatted date string
    }
    ```

  </Fragment>
</CodeTabs>

### i18n with date-fns locale

Pass any [date-fns locale](https://date-fns.org/docs/Locale) to the `locale` option.

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
    import { useTimeAgo } from "@usels/core";
    import { ko } from "date-fns/locale";

    function Component() {
      const timeAgo = useTimeAgo(new Date(), { locale: ko });
      // → "방금 전"
    }
    ```

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createTimeAgo } from "@usels/core";
    import { ko } from "date-fns/locale";

    function Component() {
      "use scope"
      const timeAgo = createTimeAgo(new Date(), { locale: ko });
      // → "방금 전"
    }
    ```

  </Fragment>
</CodeTabs>

```tsx
import { useTimeAgo } from "@usels/core";
import { ja } from "date-fns/locale";

const timeAgo = useTimeAgo(new Date("2024-01-01"), { locale: ja });
// → "約1年前"
```

## Type Declarations

```typescript
export { createTimeAgo, formatTimeAgo } from "./core";
export type { UseTimeAgoUnitNamesDefault, FormatTimeAgoOptions, TimeAgoOptions } from "./core";
export type UseTimeAgo = typeof createTimeAgo;
export declare const useTimeAgo: UseTimeAgo;
```

## Source

- Implementation: `packages/core/src/timer/useTimeAgo/index.ts`
- Documentation: `packages/core/src/timer/useTimeAgo/index.mdx`