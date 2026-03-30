---
title: useDisplayMedia
category: Sensors
sidebar:
  order: 9
---

Reactive wrapper around the [MediaDevices.getDisplayMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) API for screen sharing. Provides start/stop controls and automatically handles the browser's "Stop sharing" button.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useDisplayMedia } from "@usels/web";

function ScreenShare() {
  const { isSupported$, stream$, enabled$, start, stop } = useDisplayMedia();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Sharing: {enabled$.get() ? "Yes" : "No"}</p>
      <button onClick={() => start()}>Share Screen</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### With audio capture

```tsx twoslash
// @noErrors
import { useDisplayMedia } from "@usels/web";

function ScreenShareWithAudio() {
  const { stream$, start, stop } = useDisplayMedia({
    video: true,
    audio: true,
  });

  return (
    <div>
      <button onClick={() => start()}>Share with Audio</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### Reactive options

Options can be passed as plain values, per-field `Observable`s, or a single `Observable<UseDisplayMediaOptions>`. `video` and `audio` are read at each `start()` call, so changes take effect on the next share.

```typescript
import { observable } from "@legendapp/state";
import { useDisplayMedia } from "@usels/web";

const audio$ = observable(false);

const { start } = useDisplayMedia({
  video: true,
  audio: audio$,
});

// Later: enable audio capture reactively
audio$.set(true);
start(); // uses updated audio constraint
```

## Notes

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. `video` and `audio` are read at each `start()` call time. `immediate` is mount-time-only.
