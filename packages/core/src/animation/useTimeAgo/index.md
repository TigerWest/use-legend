---
title: useTimeAgo
description: Reactive human-readable time-ago string that auto-updates (powered by date-fns)
category: Animation
---

Returns a `ReadonlyObservable<string>` with a human-readable relative time string (e.g. "5 minutes ago", "in 2 days") that auto-updates at a configurable interval.

Formatting is delegated to [`date-fns/formatDistance`](https://date-fns.org/docs/formatDistance), enabling full i18n locale support.

Also exports `formatTimeAgo` as a standalone pure function for one-off formatting.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date("2024-01-01"));
// timeAgo.get() → "about 3 months ago"
```

### Reactive `time`

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";
import { observable } from "@legendapp/state";

const time$ = observable(new Date());
const timeAgo = useTimeAgo(time$);

time$.set(new Date("2020-01-01")); // → "about 4 years ago"
```

### With pause/resume controls

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";

const { timeAgo, isActive$, pause, resume } = useTimeAgo(new Date(), {
  controls: true,
});
```

### Custom update interval

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";

// Update every 10 seconds instead of every 30
const timeAgo = useTimeAgo(new Date(), { updateInterval: 10_000 });
```

### Show seconds

When `showSecond: true`, times under 1 minute are shown in detail (maps to date-fns `includeSeconds`).
When `showSecond: false` (default), times within 45 s show `"just now"`.

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date(Date.now() - 30_000), { showSecond: true });
// → "half a minute ago"
```

### Limit with `max`

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";

const timeAgo = useTimeAgo(new Date("2020-01-01"), {
  max: "month",
  fullDateFormatter: (d) => d.toLocaleDateString(),
});
// dates older than ~11 months → formatted date string
```

### i18n with date-fns locale

```tsx twoslash
// @noErrors
import { useTimeAgo } from "@usels/core";
import { ko } from "date-fns/locale";

const timeAgo = useTimeAgo(new Date(), { locale: ko });
// → "방금 전"
```

## `formatTimeAgo` — pure function

```tsx twoslash
// @noErrors
import { formatTimeAgo } from "@usels/core";

const str = formatTimeAgo(new Date("2024-01-01"), {}, new Date("2024-06-01"));
// → "about 5 months ago"
```

## Options

| Option              | Type                  | Default  | Reactive   | Description                                                   |
| ------------------- | --------------------- | -------- | ---------- | ------------------------------------------------------------- |
| `controls`          | `boolean`             | `false`  | mount-only | Expose `{ timeAgo, isActive$, pause, resume }`                |
| `updateInterval`    | `number`              | `30_000` | mount-only | Auto-update interval in ms                                    |
| `locale`            | `Locale` (date-fns)   | —        | mount-only | date-fns locale for i18n                                      |
| `max`               | `string \| number`    | —        | ✅         | Max diff (unit name or ms) before `fullDateFormatter` is used |
| `fullDateFormatter` | `(d: Date) => string` | ISO date | ✅         | Formatter when `max` is exceeded                              |
| `showSecond`        | `boolean`             | `false`  | ✅         | Show second-level detail; `false` shows "just now" for < 45 s |

## Notes

### Update strategy

`useTimeAgo` delegates to `useNow({ interval: updateInterval })` internally.
The default `updateInterval` is `30_000` ms (30 seconds).

### Mount-time-only options

`updateInterval` and `locale` are captured once at mount. To change them, remount the hook.

### Reactive options

`max`, `showSecond`, and `fullDateFormatter` are reactive — changing them via Observable takes effect immediately on the next tick.
