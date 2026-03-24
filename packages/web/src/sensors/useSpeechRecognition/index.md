---
title: useSpeechRecognition
category: Sensors
---

Reactive wrapper around the [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Provides start/stop/toggle controls with real-time transcript and status tracking.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useSpeechRecognition } from "@usels/web";

function SpeechToText() {
  const { isSupported$, isListening$, result$, start, stop } = useSpeechRecognition();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Listening: {isListening$.get() ? "Yes" : "No"}</p>
      <p>Transcript: {result$.get()}</p>
      <button onClick={() => start()}>Start</button>
      <button onClick={() => stop()}>Stop</button>
    </div>
  );
}
```

### With options

```tsx twoslash
// @noErrors
import { useSpeechRecognition } from "@usels/web";

function KoreanSpeech() {
  const { isListening$, isFinal$, result$, toggle } = useSpeechRecognition({
    lang: "ko-KR",
    continuous: true,
    interimResults: true,
  });

  return (
    <div>
      <p>{isFinal$.get() ? result$.get() : `(interim) ${result$.get()}`}</p>
      <button onClick={() => toggle()}>{isListening$.get() ? "Stop" : "Start"}</button>
    </div>
  );
}
```

### Reactive options

Options accept `DeepMaybeObservable`. Each field can be a plain value or an `Observable`. Changes take effect on the next `start()` call.

```tsx twoslash
// @noErrors
import { observable } from "@legendapp/state";
import { useSpeechRecognition } from "@usels/web";

function DynamicRecognition() {
  const lang$ = observable("en-US");

  const { isListening$, result$, toggle } = useSpeechRecognition({
    lang: lang$,
    continuous: false,
  });

  return (
    <div>
      <select value={lang$.get()} onChange={(e) => lang$.set(e.target.value)}>
        <option value="en-US">English</option>
        <option value="ko-KR">Korean</option>
        <option value="ja-JP">Japanese</option>
      </select>
      <p>Transcript: {result$.get()}</p>
      <button onClick={() => toggle()}>{isListening$.get() ? "Stop" : "Start"}</button>
    </div>
  );
}
```

## Notes

**`isSupported$`** reflects whether the browser supports the Web Speech Recognition API. Always check this before rendering controls.

**`isFinal$`** is `true` when the current `result$` is a finalized transcript. When `interimResults` is `true`, interim results are streamed in real-time and `isFinal$` is `false` until the recognition engine commits.

**`error$`** exposes the last `SpeechRecognitionError` event data, or `undefined` if no error has occurred.

**`options` is `DeepMaybeObservable`.** Each option field can be a plain value or an `Observable`. All options are read at each `start()` call.
