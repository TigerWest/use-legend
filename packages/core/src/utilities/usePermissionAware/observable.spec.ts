// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePermissionAware } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePermissionAware() — revalidateOn$
// ---------------------------------------------------------------------------

describe("usePermissionAware() — revalidateOn$", () => {
  it("re-calls queryPermission when revalidateOn$ changes", async () => {
    const isSupported$ = observable(true);
    const revalidateOn$ = observable(0);
    const queryPermission = vi.fn().mockResolvedValue("granted");

    const { result } = renderHook(() =>
      usePermissionAware({
        isSupported$,
        requestPermission: vi.fn(),
        queryPermission,
        revalidateOn$,
      })
    );

    await waitFor(() => {
      expect(queryPermission).toHaveBeenCalledTimes(1);
    });

    act(() => {
      revalidateOn$.set(1);
    });

    await waitFor(() => {
      expect(queryPermission).toHaveBeenCalledTimes(2);
    });

    expect(result.current.permissionState$.get()).toBe("granted");
  });

  it("updates permissionState$ on re-query result change", async () => {
    const isSupported$ = observable(true);
    const revalidateOn$ = observable(false);
    const queryPermission = vi
      .fn()
      .mockResolvedValueOnce("prompt")
      .mockResolvedValueOnce("granted");

    const { result } = renderHook(() =>
      usePermissionAware({
        isSupported$,
        requestPermission: vi.fn(),
        queryPermission,
        revalidateOn$,
      })
    );

    await waitFor(() => {
      expect(result.current.permissionState$.get()).toBe("prompt");
    });

    act(() => {
      revalidateOn$.set(true);
    });

    await waitFor(() => {
      expect(result.current.permissionState$.get()).toBe("granted");
    });
  });

  it("does not re-query when revalidateOn$ changes but isSupported$ is false", async () => {
    const isSupported$ = observable(false);
    const revalidateOn$ = observable(0);
    const queryPermission = vi.fn().mockResolvedValue("granted");

    renderHook(() =>
      usePermissionAware({
        isSupported$,
        requestPermission: vi.fn(),
        queryPermission,
        revalidateOn$,
      })
    );

    await act(async () => {
      revalidateOn$.set(1);
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(queryPermission).not.toHaveBeenCalled();
  });

  it("calls queryPermission multiple times on multiple revalidateOn$ changes", async () => {
    const isSupported$ = observable(true);
    const revalidateOn$ = observable(0);
    const queryPermission = vi.fn().mockResolvedValue("granted");

    renderHook(() =>
      usePermissionAware({
        isSupported$,
        requestPermission: vi.fn(),
        queryPermission,
        revalidateOn$,
      })
    );

    await waitFor(() => expect(queryPermission).toHaveBeenCalledTimes(1));

    act(() => revalidateOn$.set(1));
    await waitFor(() => expect(queryPermission).toHaveBeenCalledTimes(2));

    act(() => revalidateOn$.set(2));
    await waitFor(() => expect(queryPermission).toHaveBeenCalledTimes(3));
  });

  it("without revalidateOn$, queryPermission is called only once on mount", async () => {
    const isSupported$ = observable(true);
    const queryPermission = vi.fn().mockResolvedValue("granted");

    renderHook(() =>
      usePermissionAware({
        isSupported$,
        requestPermission: vi.fn(),
        queryPermission,
      })
    );

    await waitFor(() => expect(queryPermission).toHaveBeenCalledTimes(1));

    // No additional calls without revalidateOn$ trigger
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(queryPermission).toHaveBeenCalledTimes(1);
  });
});
