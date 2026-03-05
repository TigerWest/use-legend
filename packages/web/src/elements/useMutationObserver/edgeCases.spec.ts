// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMutationObserver } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useMutationObserver() — edge cases", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("mutations on old element are not reported after Ref$ target changes", async () => {
    const callback = vi.fn();

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const mo = useMutationObserver(el$ as any, callback, { attributes: true });
      return { el$, mo };
    });

    const oldEl = document.createElement("div");
    const newEl = document.createElement("div");
    document.body.append(oldEl, newEl);

    // Start observing oldEl
    act(() => result.current.el$(oldEl));

    // Switch target to newEl — observer should disconnect from oldEl
    act(() => result.current.el$(newEl));

    // Mutate oldEl — should NOT trigger callback
    await act(async () => {
      oldEl.setAttribute("data-old", "1");
      await flush();
    });

    expect(callback).not.toHaveBeenCalled();

    // Mutate newEl — SHOULD trigger callback
    await act(async () => {
      newEl.setAttribute("data-new", "1");
      await flush();
    });

    expect(callback).toHaveBeenCalledOnce();
    const records: MutationRecord[] = callback.mock.calls[0][0];
    expect(records[0].target).toBe(newEl);
  });
});
