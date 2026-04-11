import { batch, observable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import {
  createRafFn,
  createSupported,
  get,
  observe,
  onMount,
  onUnmount,
  peek,
  type DeepMaybeObservable,
  type Fn,
  type MaybeObservable,
  type ReadonlyObservable,
  type Supportable,
} from "@usels/core";
import { createEventListener } from "../useEventListener/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createOpaque } from "@usels/core/reactivity/useOpaque/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAnimateOptions extends KeyframeAnimationOptions, ConfigurableWindow {
  /** Start playing immediately on mount. @default true */
  immediate?: boolean;
  /** Commit final styles to the element on finish. @default false */
  commitStyles?: boolean;
  /** Persist the animation. @default false */
  persist?: boolean;
  /** Initial playback rate. @default 1 */
  playbackRate?: number;
  /** Called once the Animation instance is ready. */
  onReady?: (animate: Animation) => void;
  /** Called when an animation error occurs. */
  onError?: (e: unknown) => void;
}

export type UseAnimateKeyframes = MaybeObservable<Keyframe[] | PropertyIndexedKeyframes | null>;

export interface UseAnimateReturn extends Supportable {
  /** Current Animation instance. */
  animate$: ReadonlyObservable<Animation | null>;

  // ── Actions ──
  play: Fn;
  pause: Fn;
  reverse: Fn;
  finish: Fn;
  cancel: Fn;

  // ── Read-only state (synced every rAF frame) ──
  pending$: ReadonlyObservable<boolean>;
  playState$: ReadonlyObservable<AnimationPlayState>;
  replaceState$: ReadonlyObservable<AnimationReplaceState>;

  // ── Writable state (bidirectional sync) ──
  startTime$: Observable<number | null>;
  currentTime$: Observable<number | null>;
  timeline$: Observable<AnimationTimeline | null>;
  playbackRate$: Observable<number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractNativeOpts(
  raw: UseAnimateOptions | undefined
): KeyframeAnimationOptions | undefined {
  if (!raw) return undefined;
  const {
    window: _w,
    immediate: _i,
    commitStyles: _c,
    persist: _p,
    playbackRate: _r,
    onReady: _or,
    onError: _oe,
    ...rest
  } = raw;
  return rest;
}

// ---------------------------------------------------------------------------
// Core — framework-agnostic Web Animations API wrapper
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic reactive wrapper around the
 * [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).
 *
 * Must be called inside a `useScope` factory — resource setup (`update`) is
 * registered via `onMount` and cleanup via `onUnmount`. rAF sync, element
 * tracking, keyframe reactivity, and animation-event listening are all driven
 * by scope-aware `observe()` so the whole pipeline tears down on scope
 * disposal.
 */
export function createAnimate(
  target: MaybeEventTarget,
  keyframes: UseAnimateKeyframes,
  options?: number | DeepMaybeObservable<UseAnimateOptions>
): UseAnimateReturn {
  // ── Options handling ──
  const isNumberOpts = typeof options === "number";
  const opts$ = observable<UseAnimateOptions | undefined>(
    (isNumberOpts ? undefined : options) as UseAnimateOptions | undefined
  );

  // Mount-time-only fields
  const peeked = opts$.peek() ?? {};
  const immediate = peeked.immediate ?? true;
  const commitStyles = peeked.commitStyles ?? false;
  const persist = peeked.persist ?? false;
  const initialPlaybackRate = peeked.playbackRate ?? 1;

  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const fireError = (e: unknown) => (opts$.peek()?.onError ?? console.error)(e);

  // ── Core state ──
  const isSupported$ = createSupported(
    () =>
      !!win$.peek() &&
      typeof Element !== "undefined" &&
      typeof Element.prototype.animate === "function"
  );

  let anim: Animation | undefined;
  const _animate$ = createOpaque<Animation>(null);

  // Read-only state (rAF synced)
  const pending$ = observable(false);
  const playState$ = observable<AnimationPlayState>("idle");
  const replaceState$ = observable<AnimationReplaceState>("active");

  // Writable state (bidirectional sync)
  const startTime$ = observable<number | null>(null);
  const currentTime$ = observable<number | null>(null);
  const timeline$ = observable<AnimationTimeline | null>(null);
  const playbackRate$ = observable<number>(initialPlaybackRate);

  // ── Bidirectional sync guards ──
  let isSyncing = false;
  let reverseLocked = false;

  // Synchronously read animation state into observables (one-shot)
  function syncState() {
    if (!anim) return;
    isSyncing = true;
    batch(() => {
      pending$.set(anim!.pending);
      playState$.set(anim!.playState);
      replaceState$.set(anim!.replaceState);
      startTime$.set(anim!.startTime as number | null);
      currentTime$.set(anim!.currentTime as number | null);
      timeline$.set(anim!.timeline);
      playbackRate$.set(anim!.playbackRate);
    });
    isSyncing = false;
  }

  // rAF loop: Animation → Observables (every frame)
  const { resume: syncResume, pause: syncPause } = createRafFn(() => syncState(), {
    immediate: false,
  });

  // Observable → Animation (user .set() detection)
  observe(() => {
    const time = currentTime$.get();
    if (!isSyncing && anim) {
      anim.currentTime = time;
      syncResume();
    }
  });

  observe(() => {
    const rate = playbackRate$.get();
    if (!isSyncing && anim) {
      anim.playbackRate = rate;
    }
  });

  observe(() => {
    const time = startTime$.get();
    if (!isSyncing && anim) {
      anim.startTime = time;
    }
  });

  observe(() => {
    const tl = timeline$.get();
    if (!isSyncing && anim) {
      anim.timeline = tl;
    }
  });

  // ── update() — create / recreate animation ──
  function update(init?: boolean) {
    const el = peek(target);
    if (!isSupported$.peek() || !el || !(el instanceof Element)) return;

    if (!anim) {
      const nativeOpts = isNumberOpts
        ? (options as number)
        : extractNativeOpts(opts$.peek() as UseAnimateOptions | undefined);
      const newAnim = el.animate(get(keyframes), nativeOpts);
      anim = newAnim;
      _animate$.set(newAnim);
    }

    if (persist) {
      try {
        anim.persist();
      } catch {
        /* noop */
      }
    }
    if (initialPlaybackRate !== 1) {
      anim.playbackRate = initialPlaybackRate;
    }

    if (init && !immediate) {
      anim.pause();
      syncState();
    } else {
      syncResume();
    }

    opts$.peek()?.onReady?.(anim);
  }

  // ── Action functions ──
  const play: Fn = () => {
    if (anim) {
      try {
        anim.play();
        syncResume();
      } catch (e) {
        syncPause();
        fireError(e);
      }
    } else {
      update();
    }
  };

  const pause: Fn = () => {
    try {
      anim?.pause();
      syncState();
      syncPause();
    } catch (e) {
      fireError(e);
    }
  };

  const reverse: Fn = () => {
    if (!anim) update();
    if (!anim) {
      syncPause();
      return;
    }
    // Guard against reverse bursts in the same frame.
    if (reverseLocked) return;
    reverseLocked = true;
    const raf = win$.peek()?.requestAnimationFrame ?? requestAnimationFrame;
    raf(() => {
      reverseLocked = false;
    });
    try {
      // Avoid native Animation.reverse() path due to renderer instability observed in Chromium.
      // Emulate reverse by flipping playbackRate and explicitly starting playback.
      if (anim.currentTime == null) {
        // If the timeline has no currentTime yet, start from the effect end before reversing.
        const timing = (anim.effect as KeyframeEffect | null)?.getComputedTiming();
        const end = typeof timing?.endTime === "number" ? timing.endTime : 0;
        anim.currentTime = end;
      }
      const nextRate = anim.playbackRate === 0 ? -1 : -anim.playbackRate;
      anim.playbackRate = nextRate;
      anim.play();
      syncState();
      syncResume();
    } catch (e) {
      syncPause();
      fireError(e);
    }
  };

  const finish: Fn = () => {
    try {
      anim?.finish();
      if (commitStyles) {
        try {
          anim?.commitStyles();
        } catch {
          /* noop */
        }
      }
      syncState();
      syncPause();
    } catch (e) {
      fireError(e);
    }
  };

  const cancel: Fn = () => {
    try {
      anim?.cancel();
      syncState();
      syncPause();
    } catch (e) {
      fireError(e);
    }
  };

  // ── Element change → recreate animation ──
  observe(() => {
    const el = get(target);
    if (el) {
      update(true);
    } else {
      try {
        anim?.cancel();
      } catch {
        /* noop */
      }
      anim = undefined;
      _animate$.set(null);
      syncPause();
    }
  });

  // ── Keyframes & options reactivity ──
  observe(() => {
    const kf = get(keyframes);
    const nativeOpts = isNumberOpts
      ? (options as number)
      : extractNativeOpts(opts$.get() as UseAnimateOptions | undefined);
    if (anim) {
      const el = peek(target);
      if (el && el instanceof Element) {
        anim.effect = new KeyframeEffect(el, kf ?? null, nativeOpts);
      }
    }
  });

  // ── Animation events → sync pause ──
  createEventListener(_animate$, ["cancel", "finish", "remove"], () => {
    syncState();
    syncPause();
  });

  // commitStyles on finish
  createEventListener(_animate$, "finish", () => {
    if (commitStyles) {
      try {
        anim?.commitStyles();
      } catch {
        /* noop */
      }
    }
  });

  // ── Lifecycle ──
  onMount(() => update(true));

  onUnmount(() => {
    try {
      anim?.cancel();
    } catch {
      /* noop */
    }
    syncPause();
  });

  // ── Return ──
  return {
    isSupported$: isSupported$ as ReadonlyObservable<boolean>,
    animate$: _animate$ as unknown as ReadonlyObservable<Animation | null>,

    play,
    pause,
    reverse,
    finish,
    cancel,

    pending$: pending$ as ReadonlyObservable<boolean>,
    playState$: playState$ as ReadonlyObservable<AnimationPlayState>,
    replaceState$: replaceState$ as ReadonlyObservable<AnimationReplaceState>,

    startTime$,
    currentTime$,
    timeline$,
    playbackRate$,
  };
}
