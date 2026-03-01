// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));
import { useRef$ } from "../useRef$";
import { useMutationObserver } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useMutationObserver()", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("isSupported is true when MutationObserver is available", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
    );
    expect(result.current.isSupported$.get()).toBe(true);
  });

  it("calls callback when attribute changes", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    renderHook(() => useMutationObserver(wrapEl(el), callback, { attributes: true }));

    await act(async () => {
      el.setAttribute("data-test", "value");
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].type).toBe("attributes");
  });

  it("calls callback when child is added", async () => {
    const callback = vi.fn();
    const parent = document.createElement("div");
    document.body.appendChild(parent);

    renderHook(() => useMutationObserver(wrapEl(parent), callback, { childList: true }));

    await act(async () => {
      parent.appendChild(document.createElement("span"));
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].type).toBe("childList");
  });

  it("calls callback when child is removed", async () => {
    const callback = vi.fn();
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    renderHook(() => useMutationObserver(wrapEl(parent), callback, { childList: true }));

    await act(async () => {
      parent.removeChild(child);
      await flush();
    });

    expect(callback).toHaveBeenCalled();
  });

  it("calls callback when text content changes", async () => {
    const callback = vi.fn();
    const el = document.createElement("p");
    const text = document.createTextNode("initial");
    el.appendChild(text);
    document.body.appendChild(el);

    renderHook(() =>
      useMutationObserver(wrapEl(text as unknown as Element), callback, {
        characterData: true,
      })
    );

    await act(async () => {
      text.data = "changed";
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].type).toBe("characterData");
  });

  it("observes multiple targets independently", async () => {
    const callback = vi.fn();
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    document.body.append(el1, el2);

    renderHook(() =>
      useMutationObserver([wrapEl(el1), wrapEl(el2)], callback, { attributes: true })
    );

    await act(async () => {
      el1.setAttribute("data-a", "1");
      await flush();
    });

    await act(async () => {
      el2.setAttribute("data-b", "2");
      await flush();
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("deduplicates targets when same element is passed twice", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    renderHook(() => useMutationObserver([wrapEl(el), wrapEl(el)], callback, { attributes: true }));

    await act(async () => {
      el.setAttribute("data-test", "value");
      await flush();
    });

    // Observed only once despite being in the array twice
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("stop() prevents callback from being called after disconnecting", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), callback, { attributes: true })
    );

    act(() => {
      result.current.stop();
    });

    await act(async () => {
      el.setAttribute("data-test", "after-stop");
      await flush();
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("stop() can be called multiple times without error", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
    );

    expect(() => {
      result.current.stop();
      result.current.stop();
    }).not.toThrow();
  });

  it("takeRecords() returns an array", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
    );
    expect(Array.isArray(result.current.takeRecords())).toBe(true);
  });

  it("takeRecords() returns empty array when no pending records", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
    );
    expect(result.current.takeRecords()).toHaveLength(0);
  });

  it("handles null target gracefully without throwing", () => {
    expect(() => {
      renderHook(() => useMutationObserver(null, vi.fn(), { attributes: true }));
    }).not.toThrow();
  });

  it("cleans up observer on unmount", async () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { unmount } = renderHook(() =>
      useMutationObserver(wrapEl(el), vi.fn(), { attributes: true })
    );

    unmount();
    await flush(); // useEffectOnce defers cleanup via queueMicrotask in test env

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });

  // ── isSupported: false ──────────────────────────────────────────────────────

  it("isSupported is false and no observer is created when MutationObserver is unavailable", () => {
    vi.stubGlobal("MutationObserver", undefined);

    const el = document.createElement("div");
    document.body.appendChild(el);
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), callback, { attributes: true })
    );

    expect(result.current.isSupported$.get()).toBe(false);
    el.setAttribute("data-x", "1");
    expect(callback).not.toHaveBeenCalled();
  });

  // ── Observable / Ref$ target reactivity ─────────────────────────────────────

  it("reacts to Observable<Element|null> target — starts observing after value is set", async () => {
    const callback = vi.fn();
    const target$ = observable<Element | null>(null);

    renderHook(() => useMutationObserver(target$ as any, callback, { attributes: true }));

    const el = document.createElement("div");
    document.body.appendChild(el);

    act(() => {
      target$.set(el);
    });

    await act(async () => {
      el.setAttribute("data-obs", "1");
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].type).toBe("attributes");
  });

  it("reacts to Ref$ target — starts observing after element is assigned", async () => {
    const callback = vi.fn();

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const mo = useMutationObserver(el$ as any, callback, { attributes: true });
      return { el$, mo };
    });

    const div = document.createElement("div");
    document.body.appendChild(div);

    act(() => result.current.el$(div));

    await act(async () => {
      div.setAttribute("data-el", "1");
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].type).toBe("attributes");
  });

  // ── subtree ─────────────────────────────────────────────────────────────────

  it("detects mutation in a descendant node when subtree: true", async () => {
    const callback = vi.fn();
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);

    renderHook(() =>
      useMutationObserver(wrapEl(parent), callback, { attributes: true, subtree: true })
    );

    await act(async () => {
      child.setAttribute("data-deep", "1");
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].target).toBe(child);
    expect(records[0].type).toBe("attributes");
  });

  // ── attributeFilter ─────────────────────────────────────────────────────────

  it("fires only for attributes listed in attributeFilter", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    renderHook(() =>
      useMutationObserver(wrapEl(el), callback, {
        attributes: true,
        attributeFilter: ["data-allowed"],
      })
    );

    await act(async () => {
      el.setAttribute("data-blocked", "x");
      await flush();
    });
    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      el.setAttribute("data-allowed", "y");
      await flush();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  // ── attributeOldValue ───────────────────────────────────────────────────────

  it("includes oldValue in record when attributeOldValue: true", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    el.setAttribute("data-val", "before");
    document.body.appendChild(el);

    renderHook(() =>
      useMutationObserver(wrapEl(el), callback, {
        attributes: true,
        attributeOldValue: true,
      })
    );

    await act(async () => {
      el.setAttribute("data-val", "after");
      await flush();
    });

    expect(callback).toHaveBeenCalled();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].oldValue).toBe("before");
  });

  // ── resume ──────────────────────────────────────────────────────────────────

  it("resume() restarts observation after stop()", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { result } = renderHook(() =>
      useMutationObserver(wrapEl(el), callback, { attributes: true })
    );

    act(() => result.current.stop());

    await act(async () => {
      el.setAttribute("data-after-stop", "1");
      await flush();
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => result.current.resume());

    await act(async () => {
      el.setAttribute("data-after-resume", "1");
      await flush();
    });
    expect(callback).toHaveBeenCalledOnce();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].attributeName).toBe("data-after-resume");
  });

  // ── stale callback regression ───────────────────────────────────────────────

  it("uses stale callback after re-render — regression guard: no callbackRef pattern", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useMutationObserver(wrapEl(el), cb, { attributes: true }),
      { initialProps: { cb: cb1 } }
    );

    rerender({ cb: cb2 });

    await act(async () => {
      el.setAttribute("data-stale", "1");
      await flush();
    });

    // Observer was created with cb1 and is not recreated on re-render alone.
    // This test documents the current behavior — absence of callbackRef pattern.
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).not.toHaveBeenCalled();
  });
});
