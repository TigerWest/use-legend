# useWindowScroll

> Part of `@usels/web` | Category: Sensors

## Overview

Tracks the window scroll position, direction, arrived state, and scrolling status as reactive `Observable` values. A convenience wrapper around `useScroll(window)`.

## Usage

### Basic

```tsx
import { useWindowScroll } from "@usels/core";

function Component() {
  const { x, y, arrivedState } = useWindowScroll();

  return (
    <p>
      scrollX: {x.get()}, scrollY: {y.get()}
      {arrivedState.bottom.get() && " — reached bottom"}
    </p>
  );
}
```

### Back-to-top button

```tsx
import { useWindowScroll } from "@usels/core";

function BackToTop() {
  const { arrivedState } = useWindowScroll();

  return !arrivedState.top.get() ? (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Back to top</button>
  ) : null;
}
```

### Scroll direction indicator

```tsx
const { directions } = useWindowScroll();
// directions.bottom.get() → true while scrolling down
// directions.top.get()    → true while scrolling up
```

### Infinite scroll trigger

```typescript
import { useObserveEffect } from "@legendapp/state/react";

const { arrivedState } = useWindowScroll({ offset: { bottom: 200 } });

useObserveEffect(arrivedState.bottom, (e) => {
  if (e.value) fetchNextPage();
});
```

### isScrolling + onStop

```typescript
const { isScrolling } = useWindowScroll({
  idle: 300,
  onStop: () => saveScrollPosition(),
});
```

### Throttled updates

```typescript
const { y } = useWindowScroll({ throttle: 100 });
```

## Type Declarations

```typescript
export type { UseScrollOptions, UseScrollReturn };
export declare function useWindowScroll(options?: UseScrollOptions): UseScrollReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useWindowScroll/index.ts`
- Documentation: `packages/web/src/sensors/useWindowScroll/index.md`