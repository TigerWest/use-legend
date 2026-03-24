// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useSpeechRecognition } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useSpeechRecognition()", () => {
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
  };

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
      start: vi.fn(function (this: typeof mockRecognition) {
        this.onstart?.();
      }),
      stop: vi.fn(function (this: typeof mockRecognition) {
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

  describe("return shape", () => {
    it("returns observable fields and control functions", () => {
      const { result } = renderHook(() => useSpeechRecognition());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.isListening$.get).toBe("function");
      expect(typeof result.current.isFinal$.get).toBe("function");
      expect(typeof result.current.result$.get).toBe("function");
      expect(typeof result.current.error$.get).toBe("function");
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
      expect(typeof result.current.toggle).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when SpeechRecognition exists", () => {
      const { result } = renderHook(() => useSpeechRecognition());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("isListening$ is false initially", () => {
      const { result } = renderHook(() => useSpeechRecognition());
      expect(result.current.isListening$.get()).toBe(false);
    });

    it("result$ is empty string initially", () => {
      const { result } = renderHook(() => useSpeechRecognition());
      expect(result.current.result$.get()).toBe("");
    });

    it("error$ is undefined initially", () => {
      const { result } = renderHook(() => useSpeechRecognition());
      expect(result.current.error$.get()).toBeUndefined();
    });
  });

  describe("start/stop controls", () => {
    it("start() creates recognition and starts listening", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });

      expect(mockRecognition.start).toHaveBeenCalled();
      expect(result.current.isListening$.get()).toBe(true);
    });

    it("start() configures recognition with options", () => {
      const { result } = renderHook(() =>
        useSpeechRecognition({
          lang: "ko-KR",
          continuous: false,
          interimResults: false,
          maxAlternatives: 3,
        })
      );

      act(() => {
        result.current.start();
      });

      expect(recognitionInstance.lang).toBe("ko-KR");
      expect(recognitionInstance.continuous).toBe(false);
      expect(recognitionInstance.interimResults).toBe(false);
      expect(recognitionInstance.maxAlternatives).toBe(3);
    });

    it("stop() stops recognition", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.stop();
      });

      expect(result.current.isListening$.get()).toBe(false);
    });

    it("toggle() starts when not listening", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isListening$.get()).toBe(true);
    });

    it("toggle() stops when listening", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isListening$.get()).toBe(false);
    });

    it("toggle(true) starts listening", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.toggle(true);
      });

      expect(result.current.isListening$.get()).toBe(true);
    });
  });

  describe("recognition events", () => {
    it("updates result$ on recognition result", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });

      act(() => {
        recognitionInstance.onresult?.({
          results: [{ 0: { transcript: "hello world" }, isFinal: true, length: 1 }],
        });
      });

      expect(result.current.result$.get()).toBe("hello world");
      expect(result.current.isFinal$.get()).toBe(true);
    });

    it("updates error$ on recognition error", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });

      const mockError = { error: "no-speech", message: "No speech detected" };
      act(() => {
        recognitionInstance.onerror?.(mockError);
      });

      expect(result.current.error$.get()).toBe(mockError);
    });

    it("sets isListening$ to false on recognition end", () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });
      expect(result.current.isListening$.get()).toBe(true);

      act(() => {
        recognitionInstance.onend?.();
      });

      expect(result.current.isListening$.get()).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("stops recognition on unmount", async () => {
      const { result, unmount } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.start();
      });

      unmount();
      await flush();

      expect(mockRecognition.stop).toHaveBeenCalled();
    });
  });
});
