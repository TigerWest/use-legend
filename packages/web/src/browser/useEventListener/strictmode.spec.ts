// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import React, { StrictMode } from "react";
import { useEventListener } from ".";

afterEach(() => vi.restoreAllMocks());

describe("useEventListener — StrictMode", () => {
  it("listener still fires after StrictMode double-mount cycle", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const listener = vi.fn();

    function Component() {
      useEventListener(div, "click", listener);
      return null;
    }

    render(React.createElement(StrictMode, null, React.createElement(Component)));

    div.dispatchEvent(new Event("click"));
    expect(listener).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });

  it("addEventListener net active count is 1 after strict-mode initial cycle, 0 after unmount", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const addSpy = vi.spyOn(div, "addEventListener");
    const removeSpy = vi.spyOn(div, "removeEventListener");
    const listener = vi.fn();

    function Component() {
      useEventListener(div, "click", listener);
      return null;
    }

    const { unmount } = render(
      React.createElement(StrictMode, null, React.createElement(Component))
    );

    // After strict mode initial cycle: 1 active listener (add - remove == 1)
    expect(addSpy.mock.calls.length - removeSpy.mock.calls.length).toBe(1);

    div.dispatchEvent(new Event("click"));
    expect(listener).toHaveBeenCalledTimes(1);

    unmount();
    // After unmount: symmetric
    expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);

    document.body.removeChild(div);
  });
});
