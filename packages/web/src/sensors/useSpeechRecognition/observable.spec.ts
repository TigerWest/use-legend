// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useSpeechRecognition } from ".";

const mockRecognitionInstances: any[] = [];

beforeEach(() => {
  mockRecognitionInstances.length = 0;
  vi.stubGlobal(
    "SpeechRecognition",
    class {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onstart: (() => void) | null = null;
      onresult: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      constructor() {
        mockRecognitionInstances.push(this);
      }
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSpeechRecognition() — reactive options", () => {
  describe("Observable option change", () => {
    it("lang$ observable — changing before start() uses new lang", () => {
      const lang$ = observable("en-US");
      const { result } = renderHook(() => useSpeechRecognition({ lang: lang$ }));

      act(() => {
        lang$.set("fr-FR");
      });
      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances).toHaveLength(1);
      expect(mockRecognitionInstances[0].lang).toBe("fr-FR");
    });

    it("continuous$ observable — changing before start() uses new value", () => {
      const continuous$ = observable(true);
      const { result } = renderHook(() => useSpeechRecognition({ continuous: continuous$ }));

      act(() => {
        continuous$.set(false);
      });
      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances[0].continuous).toBe(false);
    });

    it("interimResults$ observable — changing before start() uses new value", () => {
      const interimResults$ = observable(true);
      const { result } = renderHook(() =>
        useSpeechRecognition({ interimResults: interimResults$ })
      );

      act(() => {
        interimResults$.set(false);
      });
      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances[0].interimResults).toBe(false);
    });

    it("maxAlternatives$ observable — changing before start() uses new value", () => {
      const maxAlternatives$ = observable(1);
      const { result } = renderHook(() =>
        useSpeechRecognition({ maxAlternatives: maxAlternatives$ })
      );

      act(() => {
        maxAlternatives$.set(3);
      });
      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances[0].maxAlternatives).toBe(3);
    });

    it("passing full options as observable works", () => {
      const opts$ = observable({ lang: "de-DE", continuous: false, interimResults: false });
      const { result } = renderHook(() => useSpeechRecognition(opts$));

      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances[0].lang).toBe("de-DE");
      expect(mockRecognitionInstances[0].continuous).toBe(false);
    });

    it("each start() call creates fresh recognition with current opts", () => {
      const lang$ = observable("en-US");
      const { result } = renderHook(() => useSpeechRecognition({ lang: lang$ }));

      act(() => {
        result.current.start();
      });
      expect(mockRecognitionInstances[0].lang).toBe("en-US");

      // Stop and change lang
      act(() => {
        result.current.stop();
      });
      act(() => {
        lang$.set("ja-JP");
      });
      act(() => {
        result.current.start();
      });

      expect(mockRecognitionInstances[1].lang).toBe("ja-JP");
    });
  });
});
