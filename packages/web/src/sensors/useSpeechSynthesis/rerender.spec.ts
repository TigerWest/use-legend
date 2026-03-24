// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSpeechSynthesis } from ".";

describe("useSpeechSynthesis() — rerender stability", () => {
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSpeechSynthesis = {
      speak: vi.fn((utterance: any) => {
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

  describe("observable references are stable across re-renders", () => {
    it("isSupported$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.isSupported$;
      rerender();
      expect(result.current.isSupported$).toBe(first);
    });

    it("isPlaying$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.isPlaying$;
      rerender();
      expect(result.current.isPlaying$).toBe(first);
    });

    it("status$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.status$;
      rerender();
      expect(result.current.status$).toBe(first);
    });

    it("error$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.error$;
      rerender();
      expect(result.current.error$).toBe(first);
    });
  });

  describe("function references are stable across re-renders", () => {
    it("speak identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.speak;
      rerender();
      expect(result.current.speak).toBe(first);
    });

    it("stop identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.stop;
      rerender();
      expect(result.current.stop).toBe(first);
    });

    it("toggle identity is stable", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));
      const first = result.current.toggle;
      rerender();
      expect(result.current.toggle).toBe(first);
    });
  });

  describe("status persists across re-renders", () => {
    it("status$ remains 'play' after re-render", () => {
      const { result, rerender } = renderHook(() => useSpeechSynthesis("hello"));

      act(() => {
        result.current.speak();
      });

      expect(result.current.status$.get()).toBe("play");

      rerender();

      expect(result.current.status$.get()).toBe("play");
    });
  });
});
