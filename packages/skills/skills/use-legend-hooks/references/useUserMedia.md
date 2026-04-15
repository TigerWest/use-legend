# useUserMedia

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) API. Provides start/stop/restart controls and exposes the media stream as an observable.

## Usage

```tsx
import { useUserMedia } from "@usels/web";

function CameraFeed() {
  const { isSupported$, stream$, enabled$, start, stop } = useUserMedia({
    constraints: { audio: false, video: true },
  });

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Streaming: {enabled$.get() ? "Yes" : "No"}</p>
      <button onClick={() => start()}>Start</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### Auto-start on mount

```tsx
import { useUserMedia } from "@usels/web";

function AutoCamera() {
  const { stream$, stop } = useUserMedia({
    constraints: { audio: false, video: true },
    immediate: true,
  });

  // Stream starts automatically on mount
  // Stops automatically on unmount
  return <button onClick={() => stop()}>Stop</button>;
}
```

### Audio-only capture

```tsx
import { useUserMedia } from "@usels/web";

function Microphone() {
  const { stream$, start, stop, enabled$ } = useUserMedia({
    constraints: { audio: true, video: false },
  });

  return (
    <button onClick={() => (enabled$.get() ? stop() : start())}>
      {enabled$.get() ? "Stop Recording" : "Start Recording"}
    </button>
  );
}
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseUserMediaOptions>`. `constraints` are read at each `start()` / `restart()` call.

```typescript
import { observable } from "@usels/core";
import { useUserMedia } from "@usels/web";

const constraints$ = observable<MediaStreamConstraints>({ audio: false, video: true });

const { start, restart } = useUserMedia({ constraints: constraints$ });

// Later: switch to audio+video reactively
constraints$.set({ audio: true, video: true });
restart(); // uses updated constraints
```

## Type Declarations

```typescript
export interface UseUserMediaOptions {
    constraints?: MediaStreamConstraints;
    immediate?: boolean;
}
export interface UseUserMediaReturn extends Supportable {
    stream$: ReadonlyObservable<OpaqueObject<MediaStream> | null>;
    enabled$: ReadonlyObservable<boolean>;
    start: () => Promise<MediaStream>;
    stop: () => void;
    restart: () => Promise<MediaStream>;
}
export declare function useUserMedia(options?: DeepMaybeObservable<UseUserMediaOptions>): UseUserMediaReturn;
```

## Source

- Implementation: `packages/web/src/sensors/useUserMedia/index.ts`
- Documentation: `packages/web/src/sensors/useUserMedia/index.md`