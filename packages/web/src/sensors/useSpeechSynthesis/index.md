---
title: useSpeechSynthesis
category: Sensors
---

Reactive wrapper around the [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) API. Provides speak/stop/toggle controls with real-time status tracking.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useSpeechSynthesis } from "@usels/web";

function TextToSpeech() {
  const { isSupported$, isPlaying$, status$, speak, stop } = useSpeechSynthesis("Hello world");

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Status: {status$.get()}</p>
      <button onClick={() => speak()}>Speak</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### With voice options

```tsx twoslash
// @noErrors
import { useSpeechSynthesis } from "@usels/web";

function CustomVoice() {
  const { speak, stop, isPlaying$ } = useSpeechSynthesis("안녕하세요", {
    lang: "ko-KR",
    pitch: 1.2,
    rate: 0.9,
  });

  return (
    <button onClick={() => (isPlaying$.get() ? stop() : speak())}>
      {isPlaying$.get() ? "Stop" : "Speak"}
    </button>
  );
}
```

### Reactive text and options

The `text` parameter accepts `MaybeObservable<string>`, and options accept `DeepMaybeObservable`. Changes take effect on the next `speak()` call.

```tsx twoslash
// @noErrors
import { observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useSpeechSynthesis } from "@usels/web";

function DynamicSpeech() {
  const text$ = useObservable("Hello world");
  const rate$ = observable(1);

  const { speak } = useSpeechSynthesis(text$, { rate: rate$ });

  return (
    <div>
      <input value={text$.get()} onChange={(e) => text$.set(e.target.value)} />
      <button onClick={() => speak()}>Speak</button>
    </div>
  );
}
```

## Notes

**`text` is `MaybeObservable<string>`.** Pass a plain string or an `Observable<string>`. The latest value is read at each `speak()` call.

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. All options are read at each `speak()` call time. The `voice` option uses opaque wrapping to prevent Legend-State from deep-proxying the DOM object.
