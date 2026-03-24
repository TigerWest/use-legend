// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSpeechRecognition } from ".";

let recognitionInstance: any;
let mockRecognition: {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};

function setupMock() {
  mockRecognition = {
    lang: "",
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
    onstart: null,
    onresult: null,
    onerror: null,
    onend: null,
    start: vi.fn(function (this: typeof mockRecognition) {
      this.onstart?.();
    }),
    stop: vi.fn(function (this: typeof mockRecognition) {
      this.onend?.();
    }),
    abort: vi.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  vi.stubGlobal(
    "SpeechRecognition",
    class {
      constructor() {
        Object.assign(this, mockRecognition);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        recognitionInstance = this;
      }
    }
  );
}

beforeEach(() => {
  setupMock();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSpeechRecognition() — edge cases", () => {
  it("isSupported$ is false when SpeechRecognition API is unavailable", () => {
    vi.unstubAllGlobals();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported$.get()).toBe(false);
  });

  it("start() does nothing when API is unsupported", () => {
    vi.unstubAllGlobals();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    expect(result.current.isListening$.get()).toBe(false);
  });

  it("calling start() while already listening does not create a second instance", () => {
    let instanceCount = 0;
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "SpeechRecognition",
      class {
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: any = null;
        onresult: any = null;
        lang = "";
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        constructor() {
          instanceCount++;
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          recognitionInstance = this;
        }
        start = vi.fn(function (this: any) {
          this.onstart?.();
        });
        stop = vi.fn(function (this: any) {
          this.onend?.();
        });
        abort = vi.fn();
      }
    );

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.start());
    expect(result.current.isListening$.get()).toBe(true);

    // Second start() — should be a no-op because isListening$ is true
    act(() => result.current.start());
    expect(instanceCount).toBe(1);
  });

  it("recognition error updates error$", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());

    const errorData = { error: "network", message: "Network failure" };
    act(() => recognitionInstance.onerror?.(errorData));

    expect(result.current.error$.get()).toEqual(errorData);
  });

  it("toggle() starts recognition when not listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.toggle());

    expect(result.current.isListening$.get()).toBe(true);
  });

  it("toggle(false) stops recognition when listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.start());
    expect(result.current.isListening$.get()).toBe(true);

    act(() => result.current.toggle(false));
    expect(result.current.isListening$.get()).toBe(false);
  });

  it("onresult with a final result updates result$ and isFinal$", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());

    act(() => {
      recognitionInstance.onresult?.({
        results: [{ 0: { transcript: "hello world", confidence: 0.9 }, isFinal: true, length: 1 }],
      });
    });

    expect(result.current.result$.get()).toBe("hello world");
    expect(result.current.isFinal$.get()).toBe(true);
  });

  it("uses webkitSpeechRecognition as fallback when SpeechRecognition is absent", () => {
    vi.unstubAllGlobals();
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    vi.stubGlobal(
      "webkitSpeechRecognition",
      class {
        constructor() {
          recognitionInstance = this as any;
        }
        onstart: any = null;
        onend: any = null;
        onerror: any = null;
        onresult: any = null;
        start = vi.fn();
        stop = vi.fn();
        abort = vi.fn();
      }
    );
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported$.get()).toBe(true);
  });

  it("stop() sets isListening$ to false immediately", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.start());
    expect(result.current.isListening$.get()).toBe(true);

    act(() => result.current.stop());
    expect(result.current.isListening$.get()).toBe(false);
  });

  it("onresult with multiple results concatenates transcripts", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());

    act(() => {
      recognitionInstance.onresult?.({
        results: [
          { 0: { transcript: "hello ", confidence: 0.9 }, isFinal: false, length: 1 },
          { 0: { transcript: "world", confidence: 0.8 }, isFinal: true, length: 1 },
        ],
      });
    });

    expect(result.current.result$.get()).toBe("hello world");
    expect(result.current.isFinal$.get()).toBe(true);
  });
});
