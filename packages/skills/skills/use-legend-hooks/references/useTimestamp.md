# useTimestamp

> Part of `@usels/core` | Category: Timer

## Overview

Reactive Unix timestamp (ms) that auto-updates on every animation frame or interval

## Usage

```tsx
import { useTimestamp } from "@usels/core";

const ts = useTimestamp();
// ts.get() → current Date.now(), updated every frame
```

### With offset

```tsx
import { useTimestamp } from "@usels/core";
import { observable } from "@legendapp/state";

const offset$ = observable(5000);
const ts = useTimestamp({ offset: offset$ });
// ts.get() → Date.now() + 5000 — offset is reactive, updates each tick
```

### With callback

```tsx
import { useTimestamp } from "@usels/core";

const ts = useTimestamp({
  callback: (timestamp) => {
    console.log("tick:", timestamp);
  },
});
```

### With pause/resume controls

```tsx
import { useTimestamp } from "@usels/core";

const { timestamp$, isActive$, pause, resume } = useTimestamp({ controls: true });
```

## Type Declarations

```typescript
export { createTimestamp } from "./core";
export type { TimestampOptions } from "./core";
export interface UseTimestampOptions<Controls extends boolean = false> {
    controls?: Controls;
    offset?: number;
    interval?: "requestAnimationFrame" | number;
    callback?: (timestamp: number) => void;
}
export declare function useTimestamp(options?: UseTimestampOptions<false>): ReadonlyObservable<number>;
export declare function useTimestamp(options: UseTimestampOptions<true>): {
    timestamp$: ReadonlyObservable<number>;
} & Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useTimestamp/index.ts`
- Documentation: `packages/core/src/timer/useTimestamp/index.md`