"use client";
import { batch, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";
import { useMount, useObservable, useObserve, useUnmount } from "@legendapp/state/react";
import { useRef } from "react";
import { type MaybeElement, getElement, peekElement } from "@usels/core";
import {
  useMaybeObservable,
  usePeekInitial,
  useSupported,
  useRafFn,
  get,
  type ReadonlyObservable,
  type Fn,
  type MaybeObservable,
  type DeepMaybeObservable,
} from "@usels/core";
import { useEventListener } from "@browser/useEventListener";
import { defaultWindow, type ConfigurableWindow } from "@usels/core/shared/configurable";

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

export interface UseAnimateReturn {
  /** Web Animations API support flag. */
  isSupported$: ReadonlyObservable<boolean>;
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
// Implementation
// ---------------------------------------------------------------------------

export function useAnimate(
  target: MaybeElement,
  keyframes: UseAnimateKeyframes,
  options?: number | DeepMaybeObservable<UseAnimateOptions>
): UseAnimateReturn {
  // ── Options handling ──
  const isNumberOpts = typeof options === "number";

  const opts$ = useMaybeObservable(
    isNumberOpts ? undefined : (options as DeepMaybeObservable<UseAnimateOptions> | undefined),
    { onReady: "function", onError: "function" }
  );

  // Mount-time-only fields (Rule 3)
  const immediate = usePeekInitial(opts$.immediate, true);
  const commitStyles = usePeekInitial(opts$.commitStyles, false);
  const persist = usePeekInitial(opts$.persist, false);
  const initialPlaybackRate = usePeekInitial(opts$.playbackRate, 1);
  const _window = usePeekInitial(opts$.window) ?? defaultWindow;

  const fireError = (e: unknown) => (opts$.peek()?.onError ?? console.error)(e);

  // ── Core state ──
  const isSupported$ = useSupported(
    () =>
      !!_window && typeof Element !== "undefined" && typeof Element.prototype.animate === "function"
  );

  const animRef = useRef<Animation | undefined>(undefined);
  const _animate$ = useObservable<OpaqueObject<Animation> | null>(null);

  // Read-only state (rAF synced)
  const pending$ = useObservable(false);
  const playState$ = useObservable<AnimationPlayState>("idle");
  const replaceState$ = useObservable<AnimationReplaceState>("active");

  // Writable state (bidirectional sync)
  const startTime$ = useObservable<number | null>(null);
  const currentTime$ = useObservable<number | null>(null);
  const timeline$ = useObservable<AnimationTimeline | null>(null);
  const playbackRate$ = useObservable<number>(initialPlaybackRate);

  // ── Bidirectional sync ──
  const isSyncing = useRef(false);
  const reverseLocked = useRef(false);

  // Synchronously read animation state into observables (one-shot)
  function syncState() {
    const anim = animRef.current;
    if (!anim) return;
    isSyncing.current = true;
    batch(() => {
      pending$.set(anim.pending);
      playState$.set(anim.playState);
      replaceState$.set(anim.replaceState);
      startTime$.set(anim.startTime as number | null);
      currentTime$.set(anim.currentTime as number | null);
      timeline$.set(anim.timeline);
      playbackRate$.set(anim.playbackRate);
    });
    isSyncing.current = false;
  }

  // rAF loop: Animation → Observables (every frame)
  const { resume: syncResume, pause: syncPause } = useRafFn(() => syncState(), {
    immediate: false,
  });

  // Observable → Animation (user .set() detection)
  useObserve(() => {
    const time = currentTime$.get();
    if (!isSyncing.current && animRef.current) {
      animRef.current.currentTime = time;
      syncResume();
    }
  });

  useObserve(() => {
    const rate = playbackRate$.get();
    if (!isSyncing.current && animRef.current) {
      animRef.current.playbackRate = rate;
    }
  });

  useObserve(() => {
    const time = startTime$.get();
    if (!isSyncing.current && animRef.current) {
      animRef.current.startTime = time;
    }
  });

  useObserve(() => {
    const tl = timeline$.get();
    if (!isSyncing.current && animRef.current) {
      animRef.current.timeline = tl;
    }
  });

  // ── update() — create / recreate animation ──
  function update(init?: boolean) {
    const el = peekElement(target);
    if (!isSupported$.peek() || !el || !(el instanceof Element)) return;

    if (!animRef.current) {
      const nativeOpts = isNumberOpts ? (options as number) : extractNativeOpts(opts$.peek());
      const anim = el.animate(get(keyframes), nativeOpts);
      animRef.current = anim;
      _animate$.set(ObservableHint.opaque(anim) as OpaqueObject<Animation>);
    }

    if (persist) {
      try {
        animRef.current.persist();
      } catch {
        /* noop */
      }
    }
    if (initialPlaybackRate !== 1) {
      animRef.current.playbackRate = initialPlaybackRate;
    }

    if (init && !immediate) {
      animRef.current.pause();
      syncState();
    } else {
      syncResume();
    }

    opts$.peek()?.onReady?.(animRef.current);
  }

  // ── Action functions ──
  const play: Fn = () => {
    if (animRef.current) {
      try {
        animRef.current.play();
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
      animRef.current?.pause();
      syncState();
      syncPause();
    } catch (e) {
      fireError(e);
    }
  };

  const reverse: Fn = () => {
    if (!animRef.current) update();
    const anim = animRef.current;
    if (!anim) {
      syncPause();
      return;
    }
    // Guard against reverse bursts in the same frame.
    if (reverseLocked.current) return;
    reverseLocked.current = true;
    const raf = _window?.requestAnimationFrame ?? requestAnimationFrame;
    raf(() => {
      reverseLocked.current = false;
    });
    try {
      // Avoid native Animation.reverse() path due renderer instability observed in Chromium.
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
      animRef.current?.finish();
      if (commitStyles) {
        try {
          animRef.current?.commitStyles();
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
      animRef.current?.cancel();
      syncState();
      syncPause();
    } catch (e) {
      fireError(e);
    }
  };

  // ── Element change → recreate animation ──
  useObserve(() => {
    const el = getElement(target);
    if (el) {
      update(true);
    } else {
      try {
        animRef.current?.cancel();
      } catch {
        /* noop */
      }
      animRef.current = undefined;
      _animate$.set(null);
      syncPause();
    }
  });

  // ── Keyframes & options reactivity ──
  useObserve(() => {
    const kf = get(keyframes);
    const nativeOpts = isNumberOpts ? (options as number) : extractNativeOpts(opts$.get());
    if (animRef.current) {
      const el = peekElement(target);
      if (el && el instanceof Element) {
        animRef.current.effect = new KeyframeEffect(el, kf ?? null, nativeOpts);
      }
    }
  });

  // ── Animation events → sync pause ──
  useEventListener(
    _animate$ as unknown as Observable<unknown>,
    ["cancel", "finish", "remove"] as unknown as string,
    () => {
      syncState();
      syncPause();
    }
  );

  // commitStyles on finish
  useEventListener(
    _animate$ as unknown as Observable<unknown>,
    "finish" as unknown as string,
    () => {
      if (commitStyles) {
        try {
          animRef.current?.commitStyles();
        } catch {
          /* noop */
        }
      }
    }
  );

  // ── Lifecycle ──
  useMount(() => update(true));

  useUnmount(() => {
    try {
      animRef.current?.cancel();
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
