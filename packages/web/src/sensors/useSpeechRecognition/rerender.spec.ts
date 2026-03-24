// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSpeechRecognition } from ".";

describe("useSpeechRecognition() — rerender stability", () => {
  let recognitionInstance: any;
  let mockRecognition: any;

  beforeEach(() => {
    mockRecognition = {
      lang: "",
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(function (this: any) {
        this.onstart?.();
      }),
      stop: vi.fn(function (this: any) {
        this.onend?.();
      }),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useSpeechRecognition());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.isListening$).toBe(first.isListening$);
    expect(result.current.isFinal$).toBe(first.isFinal$);
    expect(result.current.result$).toBe(first.result$);
    expect(result.current.error$).toBe(first.error$);
  });

  it("function references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useSpeechRecognition());
    const firstStart = result.current.start;
    const firstStop = result.current.stop;
    const firstToggle = result.current.toggle;
    rerender();
    expect(result.current.start).toBe(firstStart);
    expect(result.current.stop).toBe(firstStop);
    expect(result.current.toggle).toBe(firstToggle);
  });

  it("result persists across re-renders", () => {
    const { result, rerender } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.start();
    });
    act(() => {
      recognitionInstance.onresult?.({
        results: [{ 0: { transcript: "test" }, isFinal: true, length: 1 }],
      });
    });

    expect(result.current.result$.get()).toBe("test");
    rerender();
    expect(result.current.result$.get()).toBe("test");
  });
});
