// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useSpeechSynthesis } from ".";

let lastUtterance: any = null;

beforeEach(() => {
  lastUtterance = null;

  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text = "";
      lang = "en-US";
      pitch = 1;
      rate = 1;
      volume = 1;
      voice: any = null;
      onstart: (() => void) | null = null;
      onpause: (() => void) | null = null;
      onresume: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text?: string) {
        if (text) this.text = text;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        lastUtterance = this;
      }
    }
  );

  Object.defineProperty(window, "speechSynthesis", {
    value: {
      cancel: vi.fn(),
      speak: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  lastUtterance = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSpeechSynthesis() — reactive options", () => {
  describe("Observable option change", () => {
    it("text observable — changing text$ before speak() uses new text", () => {
      const text$ = observable("hello");
      const { result } = renderHook(() => useSpeechSynthesis(text$));

      act(() => {
        text$.set("goodbye");
      });
      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.text).toBe("goodbye");
    });

    it("lang$ option — changing before speak() uses new lang", () => {
      const lang$ = observable("en-US");
      const { result } = renderHook(() => useSpeechSynthesis("hello", { lang: lang$ }));

      act(() => {
        lang$.set("fr-FR");
      });
      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.lang).toBe("fr-FR");
    });

    it("rate$ option — changing before speak() uses new rate", () => {
      const rate$ = observable(1);
      const { result } = renderHook(() => useSpeechSynthesis("hello", { rate: rate$ }));

      act(() => {
        rate$.set(1.5);
      });
      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.rate).toBe(1.5);
    });

    it("pitch$ option — changing before speak() uses new pitch", () => {
      const pitch$ = observable(1);
      const { result } = renderHook(() => useSpeechSynthesis("hello", { pitch: pitch$ }));

      act(() => {
        pitch$.set(0.8);
      });
      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.pitch).toBe(0.8);
    });

    it("volume$ option — changing before speak() uses new volume", () => {
      const volume$ = observable(1);
      const { result } = renderHook(() => useSpeechSynthesis("hello", { volume: volume$ }));

      act(() => {
        volume$.set(0.5);
      });
      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.volume).toBe(0.5);
    });

    it("passing full options as observable works", () => {
      const opts$ = observable({ lang: "de-DE", rate: 2, pitch: 1.2, volume: 0.8 });
      const { result } = renderHook(() => useSpeechSynthesis("test", opts$));

      act(() => {
        result.current.speak();
      });

      expect(lastUtterance.lang).toBe("de-DE");
      expect(lastUtterance.rate).toBe(2);
      expect(lastUtterance.pitch).toBe(1.2);
      expect(lastUtterance.volume).toBe(0.8);
    });

    it("each speak() reads current text and options", () => {
      const text$ = observable("first");
      const lang$ = observable("en-US");
      const { result } = renderHook(() => useSpeechSynthesis(text$, { lang: lang$ }));

      act(() => {
        result.current.speak();
      });
      expect(lastUtterance.text).toBe("first");
      expect(lastUtterance.lang).toBe("en-US");

      act(() => {
        text$.set("second");
        lang$.set("es-ES");
      });
      act(() => {
        result.current.speak();
      });
      expect(lastUtterance.text).toBe("second");
      expect(lastUtterance.lang).toBe("es-ES");
    });
  });
});
