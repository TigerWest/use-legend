# useSpeechRecognition

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Provides start/stop/toggle controls with real-time transcript and status tracking.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createSpeechRecognition } from "@usels/web";

    function SpeechToText() {
      "use scope";
      const { isSupported$, isListening$, result$, start, stop } = createSpeechRecognition();

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

  </Fragment>
</CodeTabs>

### With options

```tsx
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

```tsx
import { observable } from "@usels/core";
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

## Type Declarations

```typescript
export { createSpeechRecognition } from "./core";
export type { UseSpeechRecognitionOptions, UseSpeechRecognitionReturn } from "./core";
export type UseSpeechRecognition = typeof createSpeechRecognition;
export declare const useSpeechRecognition: UseSpeechRecognition;
```

## Source

- Implementation: `packages/web/src/sensors/useSpeechRecognition/index.ts`
- Documentation: `packages/web/src/sensors/useSpeechRecognition/index.mdx`