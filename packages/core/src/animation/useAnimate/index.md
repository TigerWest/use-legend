---
title: useAnimate
category: Animation
---

Reactive [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) wrapper. Drives `element.animate()` with Observable-based reactive state for `playState`, `currentTime`, `playbackRate`, and `pending`.

## Demo

## Usage

### Basic Usage

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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

```tsx twoslash
// @noErrors
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
