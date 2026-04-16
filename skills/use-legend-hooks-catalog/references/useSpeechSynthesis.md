# useSpeechSynthesis

> Part of `@usels/web` | Category: Sensors

## Overview

Reactive wrapper around the [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) API. Provides speak/stop/toggle controls with real-time status tracking.

## Usage

<CodeTabs>
  <Fragment slot="hook">
    ```tsx
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

  </Fragment>
  <Fragment slot="scope">
    ```tsx
    import { createSpeechSynthesis } from "@usels/web";

    function TextToSpeech() {
      "use scope";
      const { isSupported$, isPlaying$, status$, speak, stop } =
        createSpeechSynthesis("Hello world");

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

  </Fragment>
</CodeTabs>

### With voice options

```tsx
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

```tsx
import { observable, useObservable } from "@usels/core";
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

## Type Declarations

```typescript
export { createSpeechSynthesis } from "./core";
export type { UseSpeechSynthesisOptions, UseSpeechSynthesisReturn, UseSpeechSynthesisStatus, UseSpeechSynthesisErrorData, } from "./core";
export type UseSpeechSynthesis = typeof createSpeechSynthesis;
export declare const useSpeechSynthesis: UseSpeechSynthesis;
```

## Source

- Implementation: `packages/web/src/sensors/useSpeechSynthesis/index.ts`
- Documentation: `packages/web/src/sensors/useSpeechSynthesis/index.mdx`