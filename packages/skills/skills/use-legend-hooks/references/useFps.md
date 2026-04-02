# useFps

> Part of `@usels/core` | Category: Timer

## Overview

Reactive frames-per-second counter using requestAnimationFrame

## Usage

```tsx
import { useFps } from "@usels/core";

const fps = useFps();
// fps.get() → current FPS (0 until first sample)
```

### Custom sampling rate

```tsx
import { useFps } from "@usels/core";

const fps = useFps({ every: 20 }); // sample every 20 frames (~333ms at 60fps)
```

## Type Declarations

```typescript
export { createFps } from "./core";
export type { FpsOptions } from "./core";
export type UseFpsOptions = Pick<FpsOptions, "every">;
export declare function useFps(options?: DeepMaybeObservable<UseFpsOptions>): ReadonlyObservable<number>;
```

## Source

- Implementation: `packages/core/src/timer/useFps/index.ts`
- Documentation: `packages/core/src/timer/useFps/index.md`