/**
 * tanstack-query integrations - Browser Mode Spec
 *
 * jsdom spec (useQuery.spec.tsx)과 달리 실제 Chromium에서 실행됩니다.
 * - 실제 fetch API, 실제 브라우저 환경에서의 React 렌더링 검증
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { observable } from "@legendapp/state";
import { useQuery } from "../useQuery";
import { createWrapper } from "../../__tests__/test-utils";

describe("useQuery() — real browser", () => {
  it("runs in an actual browser environment (not jsdom)", () => {
    expect(navigator.userAgent).not.toContain("jsdom");
  });

  it("fetch API is natively available in real browser", () => {
    expect(typeof fetch).toBe("function");
  });

  it("returns observable with data after successful query", async () => {
    const queryFn = vi.fn().mockResolvedValue({ value: 42 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["browser-test"],
          queryFn,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess.get()).toBe(true);
    });

    expect(result.current.data.get()).toEqual({ value: 42 });
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it("queryKey as Observable causes refetch when value changes", async () => {
    const key$ = observable("initial");
    let callCount = 0;
    const queryFn = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({ callCount });
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: [key$],
          queryFn,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess.get()).toBe(true);
    });
    expect(callCount).toBe(1);

    key$.set("changed");

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    });
  });
});
