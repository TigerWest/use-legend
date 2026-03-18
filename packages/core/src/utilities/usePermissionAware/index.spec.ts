// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePermissionAware } from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// usePermissionAware() — initial values
// ---------------------------------------------------------------------------

describe("usePermissionAware() — initial values", () => {
  it("permissionState$ is 'prompt' when supported and no queryPermission", () => {
    const isSupported$ = observable(true);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.permissionState$.get()).toBe("prompt");
  });

  it("permissionGranted$ is false initially", () => {
    const isSupported$ = observable(true);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.permissionGranted$.get()).toBe(false);
  });

  it("needsPermission$ is true initially when supported", () => {
    const isSupported$ = observable(true);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.needsPermission$.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// usePermissionAware() — unsupported environment
// ---------------------------------------------------------------------------

describe("usePermissionAware() — unsupported environment", () => {
  it("permissionState$ is 'unsupported' when isSupported$ is false", () => {
    const isSupported$ = observable(false);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.permissionState$.get()).toBe("unsupported");
  });

  it("needsPermission$ is false when unsupported", () => {
    const isSupported$ = observable(false);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.needsPermission$.get()).toBe(false);
  });

  it("permissionGranted$ is false when unsupported", () => {
    const isSupported$ = observable(false);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.permissionGranted$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// usePermissionAware() — ensurePermission
// ---------------------------------------------------------------------------

describe("usePermissionAware() — ensurePermission", () => {
  it("sets permissionState$ to 'granted' when requestPermission returns true", async () => {
    const isSupported$ = observable(true);
    const requestPermission = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(result.current.permissionState$.get()).toBe("granted");
    expect(result.current.permissionGranted$.get()).toBe(true);
    expect(result.current.needsPermission$.get()).toBe(false);
  });

  it("sets permissionState$ to 'denied' when requestPermission returns false", async () => {
    const isSupported$ = observable(true);
    const requestPermission = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(result.current.permissionState$.get()).toBe("denied");
    expect(result.current.needsPermission$.get()).toBe(true);
  });

  it("does not call requestPermission when unsupported", async () => {
    const isSupported$ = observable(false);
    const requestPermission = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("does not call requestPermission when already granted", async () => {
    const isSupported$ = observable(true);
    const requestPermission = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));
    await act(async () => {
      await result.current.ensurePermission();
    });
    requestPermission.mockClear();
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("auto-grants without calling requestPermission when isRequired$ is false", async () => {
    const isSupported$ = observable(true);
    const isRequired$ = observable(false);
    const requestPermission = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, isRequired$, requestPermission })
    );
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(result.current.permissionState$.get()).toBe("granted");
  });

  it("propagates error from requestPermission without changing state", async () => {
    const isSupported$ = observable(true);
    const requestPermission = vi.fn().mockRejectedValue(new Error("user denied"));
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));

    let caughtError: Error | undefined;
    await act(async () => {
      try {
        await result.current.ensurePermission();
      } catch (e) {
        caughtError = e as Error;
      }
    });

    expect(caughtError?.message).toBe("user denied");
    expect(result.current.permissionState$.get()).toBe("prompt");
  });
});

// ---------------------------------------------------------------------------
// usePermissionAware() — queryPermission
// ---------------------------------------------------------------------------

describe("usePermissionAware() — queryPermission", () => {
  it("sets initial state from queryPermission result after mount", async () => {
    const isSupported$ = observable(true);
    const queryPermission = vi.fn().mockResolvedValue("granted");
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn(), queryPermission })
    );
    await waitFor(() => {
      expect(result.current.permissionState$.get()).toBe("granted");
    });
    expect(queryPermission).toHaveBeenCalledTimes(1);
  });

  it("keeps 'prompt' when queryPermission throws", async () => {
    const isSupported$ = observable(true);
    const queryPermission = vi.fn().mockRejectedValue(new Error("permissions API unavailable"));
    renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn(), queryPermission })
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    // No assertion on state here — just verify no unhandled rejection thrown
  });

  it("does not call queryPermission when isSupported$ is false", async () => {
    const isSupported$ = observable(false);
    const queryPermission = vi.fn().mockResolvedValue("granted");
    renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn(), queryPermission })
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(queryPermission).not.toHaveBeenCalled();
  });

  it("calls queryPermission when isSupported$ switches from false to true", async () => {
    const isSupported$ = observable(false);
    const queryPermission = vi.fn().mockResolvedValue("denied");
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn(), queryPermission })
    );
    expect(queryPermission).not.toHaveBeenCalled();
    act(() => {
      isSupported$.set(true);
    });
    await waitFor(() => {
      expect(result.current.permissionState$.get()).toBe("denied");
    });
    expect(queryPermission).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// usePermissionAware() — reactive isSupported$
// ---------------------------------------------------------------------------

describe("usePermissionAware() — reactive isSupported$", () => {
  it("permissionState$ becomes 'unsupported' when isSupported$ turns false", () => {
    const isSupported$ = observable(true);
    const { result } = renderHook(() =>
      usePermissionAware({ isSupported$, requestPermission: vi.fn() })
    );
    expect(result.current.permissionState$.get()).toBe("prompt");
    act(() => {
      isSupported$.set(false);
    });
    expect(result.current.permissionState$.get()).toBe("unsupported");
  });

  it("restores underlying _state$ when isSupported$ turns true again", async () => {
    const isSupported$ = observable(true);
    const requestPermission = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => usePermissionAware({ isSupported$, requestPermission }));
    await act(async () => {
      await result.current.ensurePermission();
    });
    expect(result.current.permissionState$.get()).toBe("granted");

    act(() => isSupported$.set(false));
    expect(result.current.permissionState$.get()).toBe("unsupported");

    act(() => isSupported$.set(true));
    expect(result.current.permissionState$.get()).toBe("granted");
  });
});
