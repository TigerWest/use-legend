# useRafFn

> Part of `@usels/core` | Category: Timer

## Overview

Call a function on every requestAnimationFrame with pause/resume control

## Usage

```tsx
import { useRafFn } from "@usels/core";

const { isActive, pause, resume } = useRafFn(({ delta, timestamp }) => {
  // called ~60 times/sec
  console.log(`delta: ${delta}ms`);
});
```

### FPS limit

```tsx
import { observable, useRafFn } from "@usels/core";

const fps$ = observable(30);
useRafFn(({ delta }) => {}, { fpsLimit: fps$ });
// caps execution to 30fps; fps$.set(60) applies next frame
```

### Run once

```tsx
import { useRafFn } from "@usels/core";

useRafFn(
  ({ timestamp }) => {
    console.log("ran once at", timestamp);
  },
  { once: true }
);
```

> **Note:** `once: true` means "pause after the first frame **per resume cycle**". Calling `resume()` again starts a new cycle.

## Type Declarations

```typescript
export { createRafFn } from "./core";
export type { RafFnCallbackArguments, RafFnOptions } from "./core";
export type UseRafFnCallbackArguments = RafFnCallbackArguments;
export type UseRafFnOptions = RafFnOptions;
export declare function useRafFn(fn: (args: RafFnCallbackArguments) => void, options?: RafFnOptions): Pausable;
```

## Source

- Implementation: `packages/core/src/timer/useRafFn/index.ts`
- Documentation: `packages/core/src/timer/useRafFn/index.md`