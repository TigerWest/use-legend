# useAnimate

> Part of `@usels/web` | Category: Browser

## Overview

Reactive [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) wrapper. Drives `element.animate()` with Observable-based reactive state for `playState`, `currentTime`, `playbackRate`, and `pending`.

## Usage

### Basic Usage

```tsx
import { useRef$ } from "@usels/core";
import { useAnimate } from "@usels/core";

function MyComponent() {
  const el$ = useRef$<HTMLSpanElement>();
  const {
    isSupported$,
    animate$,
    play,
    pause,
    reverse,
    finish,
    cancel,
    pending$,
    playState$,
    replaceState$,
    startTime$,
    currentTime$,
    timeline$,
    playbackRate$,
  } = useAnimate(el$, { transform: "rotate(360deg)" }, 1000);

  return (
    <span ref={el$} style={{ display: "inline-block" }}>
      useAnimate
    </span>
  );
}
```

### Custom Keyframes

Array, object, or Observable keyframes are all supported.

```tsx
import { useRef$ } from "@usels/core";
import { useAnimate } from "@usels/core";
import { observable } from "@legendapp/state";

function MyComponent() {
  const el$ = useRef$<HTMLDivElement>();

  // Object form (PropertyIndexedKeyframes)
  useAnimate(el$, { transform: "rotate(360deg)" }, 1000);

  // Array form
  useAnimate(el$, [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 1000);

  // Observable — effect updates when value changes
  const keyframes$ = observable([
    { clipPath: "circle(20% at 0% 30%)" },
    { clipPath: "circle(20% at 50% 80%)" },
  ]);
  useAnimate(el$, keyframes$, 1000);
}
```

### Options

Pass a number as duration shorthand, or an options object with full configuration.

```typescript
useAnimate(el$, keyframes, {
  duration: 1000,
  immediate: true, // auto-play on mount (default: true)
  commitStyles: false, // commit styles on finish (default: false)
  persist: false, // persist animation (default: false)
  onReady(animate) {
    console.log("ready", animate);
  },
  onError(e) {
    console.error(e);
  },
});
```

### Delaying Start

```tsx
import { useRef$ } from "@usels/core";
import { useAnimate } from "@usels/core";

function MyComponent() {
  const el$ = useRef$<HTMLDivElement>();
  const { play } = useAnimate(
    el$,
    { opacity: [0, 1] },
    {
      duration: 1000,
      immediate: false,
    }
  );

  return <button onClick={play}>Start Animation</button>;
}
```

## Type Declarations

```typescript
export interface UseAnimateOptions extends KeyframeAnimationOptions, ConfigurableWindow {
    immediate?: boolean;
    commitStyles?: boolean;
    persist?: boolean;
    playbackRate?: number;
    onReady?: (animate: Animation) => void;
    onError?: (e: unknown) => void;
}
export type UseAnimateKeyframes = MaybeObservable<Keyframe[] | PropertyIndexedKeyframes | null>;
export interface UseAnimateReturn extends Supportable {
    animate$: ReadonlyObservable<Animation | null>;
    play: Fn;
    pause: Fn;
    reverse: Fn;
    finish: Fn;
    cancel: Fn;
    pending$: ReadonlyObservable<boolean>;
    playState$: ReadonlyObservable<AnimationPlayState>;
    replaceState$: ReadonlyObservable<AnimationReplaceState>;
    startTime$: Observable<number | null>;
    currentTime$: Observable<number | null>;
    timeline$: Observable<AnimationTimeline | null>;
    playbackRate$: Observable<number>;
}
export declare function useAnimate(target: MaybeEventTarget, keyframes: UseAnimateKeyframes, options?: number | DeepMaybeObservable<UseAnimateOptions>): UseAnimateReturn;
```

## Source

- Implementation: `packages/web/src/browser/useAnimate/index.ts`
- Documentation: `packages/web/src/browser/useAnimate/index.md`