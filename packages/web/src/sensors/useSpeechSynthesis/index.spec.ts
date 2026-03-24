// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSpeechSynthesis } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useSpeechSynthesis()", () => {
  let utteranceInstance: any;
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSpeechSynthesis = {
      speak: vi.fn((utterance: any) => {
        utteranceInstance = utterance;
        utterance.onstart?.();
      }),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
    };

    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text = "";
        lang = "";
        pitch = 1;
        rate = 1;
        volume = 1;
        voice: any = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        onpause: (() => void) | null = null;
        onresume: (() => void) | null = null;
        constructor(text?: string) {
          if (text) this.text = text;
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          utteranceInstance = this;
        }
      }
    );

    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("return shape", () => {
    it("returns observable fields and control functions", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.isPlaying$.get).toBe("function");
      expect(typeof result.current.status$.get).toBe("function");
      expect(typeof result.current.error$.get).toBe("function");
      expect(typeof result.current.speak).toBe("function");
      expect(typeof result.current.stop).toBe("function");
      expect(typeof result.current.toggle).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when speechSynthesis exists", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("isPlaying$ is false initially", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));
      expect(result.current.isPlaying$.get()).toBe(false);
    });

    it("status$ is 'init' initially", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));
      expect(result.current.status$.get()).toBe("init");
    });

    it("error$ is undefined initially", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));
      expect(result.current.error$.get()).toBeUndefined();
    });
  });

  describe("speak/stop controls", () => {
    it("speak() calls speechSynthesis.speak", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello world"));

      act(() => {
        result.current.speak();
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it("speak() creates utterance with correct text", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello world"));

      act(() => {
        result.current.speak();
      });

      expect(utteranceInstance.text).toBe("hello world");
    });

    it("speak() configures utterance with options", () => {
      const { result } = renderHook(() =>
        useSpeechSynthesis("hello", {
          lang: "ko-KR",
          pitch: 1.5,
          rate: 2,
          volume: 0.5,
        })
      );

      act(() => {
        result.current.speak();
      });

      expect(utteranceInstance.lang).toBe("ko-KR");
      expect(utteranceInstance.pitch).toBe(1.5);
      expect(utteranceInstance.rate).toBe(2);
      expect(utteranceInstance.volume).toBe(0.5);
    });

    it("stop() calls speechSynthesis.cancel()", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        result.current.stop();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it("toggle() starts when not playing", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying$.get()).toBe(true);
    });

    it("toggle() stops when playing", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying$.get()).toBe(false);
    });

    it("toggle(true) starts playing", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.toggle(true);
      });

      expect(result.current.isPlaying$.get()).toBe(true);
    });

    it("toggle(false) stops playing", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        result.current.toggle(false);
      });

      expect(result.current.isPlaying$.get()).toBe(false);
    });
  });

  describe("synthesis events", () => {
    it("updates status$ to 'play' on utterance start", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });

      expect(result.current.status$.get()).toBe("play");
    });

    it("updates isPlaying$ to true on start", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });

      expect(result.current.isPlaying$.get()).toBe(true);
    });

    it("updates status$ to 'pause' on pause event", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        utteranceInstance.onpause?.();
      });

      expect(result.current.status$.get()).toBe("pause");
    });

    it("updates status$ to 'play' on resume event", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        utteranceInstance.onpause?.();
      });
      act(() => {
        utteranceInstance.onresume?.();
      });

      expect(result.current.status$.get()).toBe("play");
    });

    it("updates status$ to 'end' on end event", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        utteranceInstance.onend?.();
      });

      expect(result.current.status$.get()).toBe("end");
    });

    it("updates isPlaying$ to false on end", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });
      act(() => {
        utteranceInstance.onend?.();
      });

      expect(result.current.isPlaying$.get()).toBe(false);
    });

    it("updates error$ on error event", () => {
      const { result } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });

      act(() => {
        utteranceInstance.onerror?.({ error: "synthesis-failed" });
      });

      expect(result.current.error$.get()).toEqual({ error: "synthesis-failed" });
      expect(result.current.isPlaying$.get()).toBe(false);
      expect(result.current.status$.get()).toBe("end");
    });
  });

  describe("unmount cleanup", () => {
    it("calls speechSynthesis.cancel() on unmount", async () => {
      const { result, unmount } = renderHook(() => useSpeechSynthesis("test"));
      act(() => {
        result.current.speak();
      });
      unmount();
      await flush();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});
