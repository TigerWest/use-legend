# useTimeAgo

> Part of `@usels/core` | Category: Timer

## Overview

Reactive human-readable time-ago string that auto-updates (powered by date-fns)

## Usage

```tsx
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date("2024-01-01"));
// timeAgo.get() → "about 3 months ago"
```

### Reactive `time`

```tsx
import { useTimeAgo } from "@usels/core";
import { observable } from "@legendapp/state";

const time$ = observable(new Date());
const timeAgo = useTimeAgo(time$);

time$.set(new Date("2020-01-01")); // → "about 4 years ago"
```

### With pause/resume controls

```tsx
import { useTimeAgo } from "@usels/core";

const { timeAgo$, isActive$, pause, resume } = useTimeAgo(new Date(), {
  controls: true,
});
```

### Custom update interval

```tsx
import { useTimeAgo } from "@usels/core";

// Update every 10 seconds instead of every 30
const timeAgo = useTimeAgo(new Date(), { updateInterval: 10_000 });
```

### Show seconds

When `showSecond: true`, times under 1 minute are shown in detail (maps to date-fns `includeSeconds`).
When `showSecond: false` (default), times within 45 s show `"just now"`.

```tsx
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date(Date.now() - 30_000), { showSecond: true });
// → "half a minute ago"
```

### Limit with `max`

```tsx
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date("2020-01-01"), {
  max: "month",
  fullDateFormatter: (d) => d.toLocaleDateString(),
});
// dates older than ~11 months → formatted date string
```

### i18n with date-fns locale

Pass any [date-fns locale](https://date-fns.org/docs/Locale) to the `locale` option.

```tsx
import { useTimeAgo } from "@usels/core";
import { ko } from "date-fns/locale";

const timeAgo = useTimeAgo(new Date(), { locale: ko });
// → "방금 전"
```

```tsx
import { useTimeAgo } from "@usels/core";
import { ja } from "date-fns/locale";

const timeAgo = useTimeAgo(new Date("2024-01-01"), { locale: ja });
// → "約1年前"
```

You can also use `formatTimeAgo` with a locale:

```tsx
import { formatTimeAgo } from "@usels/core";
import { fr } from "date-fns/locale";

const str = formatTimeAgo(new Date("2024-01-01"), { locale: fr }, new Date("2024-06-01"));
// → "il y a environ 5 mois"
```

## Type Declarations

```typescript
export { createTimeAgo, formatTimeAgo } from "./core";
export type { UseTimeAgoUnitNamesDefault, FormatTimeAgoOptions, TimeAgoOptions } from "./core";
export interface UseTimeAgoOptions<Controls extends boolean = false> {
    controls?: Controls;
    updateInterval?: number;
    locale?: import("date-fns").Locale;
    max?: import("./core").UseTimeAgoUnitNamesDefault | number;
    fullDateFormatter?: (date: Date) => string;
    showSecond?: boolean;
}
export declare function useTimeAgo(time: MaybeObservable<Date | number | string>, options?: UseTimeAgoOptions<false>): ReadonlyObservable<string>;
export declare function useTimeAgo(time: MaybeObservable<Date | number | string>, options: UseTimeAgoOptions<true>): {
    timeAgo$: ReadonlyObservable<string>;
} & Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useTimeAgo/index.ts`
- Documentation: `packages/core/src/timer/useTimeAgo/index.md`