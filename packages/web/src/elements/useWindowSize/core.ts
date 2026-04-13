import { observable, type Observable } from "@legendapp/state";
import { observe, onMount, type DeepMaybeObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";
import { createMediaQuery } from "../../browser/useMediaQuery/core";
import { createOpaque } from "@usels/core/reactivity/useOpaque/core";

export interface UseWindowSizeOptions extends ConfigurableWindow {
  initialWidth?: number;
  initialHeight?: number;
  listenOrientation?: boolean;
  includeScrollbar?: boolean;
  type?: "inner" | "outer" | "visual";
}

export type UseWindowSizeReturn = Observable<{
  width: number;
  height: number;
}>;

/**
 * Framework-agnostic reactive window size tracker.
 *
 * Tracks the browser window dimensions and updates on resize and orientation
 * change. Supports `inner`, `outer`, and `visual` viewport modes.
 * Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createWindowSize(
  options?: DeepMaybeObservable<UseWindowSizeOptions>
): UseWindowSizeReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const size$ = observable({
    width: opts$.peek()?.initialWidth ?? 0,
    height: opts$.peek()?.initialHeight ?? 0,
  });

  const update = () => {
    const win = win$.peek();
    if (!win) return;

    const type = opts$.peek()?.type ?? "inner";
    const includeScrollbar = opts$.peek()?.includeScrollbar !== false;

    let width: number;
    let height: number;

    if (type === "outer") {
      width = win.outerWidth;
      height = win.outerHeight;
    } else if (type === "visual") {
      const vp = win.visualViewport;
      if (vp) {
        width = vp.width * vp.scale;
        height = vp.height * vp.scale;
      } else {
        width = win.innerWidth;
        height = win.innerHeight;
      }
    } else {
      if (includeScrollbar) {
        width = win.innerWidth;
        height = win.innerHeight;
      } else {
        width = win.document.documentElement.clientWidth;
        height = win.document.documentElement.clientHeight;
      }
    }

    size$.assign({ width, height });
  };

  onMount(update);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- win$ is Observable<OpaqueObject<Window> | null>, matches Overload 2
  createEventListener(win$ as any, "resize", update, { passive: true });

  // Visual viewport resize listener — only relevant for type: "visual"
  const vp$ = createOpaque<VisualViewport>(null);
  onMount(() => {
    if (opts$.peek()?.type !== "visual") return;
    const vp = win$.peek()?.visualViewport ?? null;
    vp$.set(vp);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OpaqueObservable is not in MaybeEventTarget union; runtime valueOf() unwrapping handles it correctly
  createEventListener(vp$ as any, "resize", update);

  // Re-measure when type or includeScrollbar changes (skip initial run)
  let isFirstTypeChange = true;
  observe(() => {
    opts$.get();
    if (isFirstTypeChange) {
      isFirstTypeChange = false;
      return;
    }
    update();
  });

  // Orientation change — skip initial run, guard with listenOrientation flag
  const matches$ = createMediaQuery("(orientation: portrait)");
  let isFirstOrientation = true;
  observe(() => {
    matches$.get();
    if (isFirstOrientation) {
      isFirstOrientation = false;
      return;
    }
    if (opts$.peek()?.listenOrientation !== false) {
      update();
    }
  });

  return size$;
}
