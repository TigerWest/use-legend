// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useMutationObserver } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useMutationObserver()", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("isSupported is true when MutationObserver is available", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(el, vi.fn(), { attributes: true }),
    );
    expect(result.current.isSupported.get()).toBe(true);
  });

  it("calls callback when attribute changes", async () => {
    const callback = vi.fn();
    const el = document.createElement("div");
    document.body.appendChild(el);

    renderHook(() =>
      useMutationObserver(el, callback, { attributes: true }),
    );

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

    renderHook(() =>
      useMutationObserver(parent, callback, { childList: true }),
    );

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

    renderHook(() =>
      useMutationObserver(parent, callback, { childList: true }),
    );

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
      useMutationObserver(text as unknown as Element, callback, {
        characterData: true,
      }),
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
      useMutationObserver([el1, el2], callback, { attributes: true }),
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

    renderHook(() =>
      useMutationObserver([el, el], callback, { attributes: true }),
    );

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
      useMutationObserver(el, callback, { attributes: true }),
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
      useMutationObserver(el, vi.fn(), { attributes: true }),
    );

    expect(() => {
      result.current.stop();
      result.current.stop();
    }).not.toThrow();
  });

  it("takeRecords() returns an array", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(el, vi.fn(), { attributes: true }),
    );
    expect(Array.isArray(result.current.takeRecords())).toBe(true);
  });

  it("takeRecords() returns empty array when no pending records", () => {
    const el = document.createElement("div");
    const { result } = renderHook(() =>
      useMutationObserver(el, vi.fn(), { attributes: true }),
    );
    expect(result.current.takeRecords()).toHaveLength(0);
  });

  it("handles null target gracefully without throwing", () => {
    expect(() => {
      renderHook(() =>
        useMutationObserver(null, vi.fn(), { attributes: true }),
      );
    }).not.toThrow();
  });

  it("cleans up observer on unmount", async () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { unmount } = renderHook(() =>
      useMutationObserver(el, vi.fn(), { attributes: true }),
    );

    unmount();
    await flush(); // useEffectOnce defers cleanup via queueMicrotask in test env

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
