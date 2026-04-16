---
name: use-legend-hooks-catalog
description: Use when looking up what @usels/core or @usels/web hooks exist, their signatures, options, or return types — covers 100+ Observable-native React hooks built on Legend-State
---

# use-legend Hook Catalog

> Observable-native React utility hooks built on Legend-State.
> 108 hooks across 2 packages: `@usels/core` and `@usels/web`.

> Auto-generated. Run `pnpm skills:build` to regenerate.

## @usels/core

### Observe (8 hooks)

| Hook | Description |
|------|-------------|
| [`useObserveDebounced`](references/useObserveDebounced.md) | Runs a reactive effect debounced — fires only after `ms` milliseconds of inactivity. Built on `us... |
| [`useObserveIgnorable`](references/useObserveIgnorable.md) | Runs a reactive effect with an `ignoreUpdates` escape hatch. Changes made inside `ignoreUpdates(u... |
| [`useObservePausable`](references/useObservePausable.md) | Runs a reactive effect with built-in pause/resume controls. Built on `useObserveWithFilter`. The ... |
| [`useObserveThrottled`](references/useObserveThrottled.md) | Runs a reactive effect throttled — fires at most once per `ms` milliseconds. Built on `useObserve... |
| [`useObserveTriggerable`](references/useObserveTriggerable.md) | Runs a reactive effect with a manual `trigger()` method and an `ignoreUpdates` escape hatch. |
| [`useObserveWithFilter`](references/useObserveWithFilter.md) | Runs a reactive effect gated by an EventFilter. The selector always tracks dependencies on every ... |
| [`useWatch`](references/useWatch.md) | Runs a reactive effect that skips the first effect execution by default (lazy mode). Pass `immedi... |
| [`useWhenever`](references/useWhenever.md) | Shorthand for watching a source and running an effect only when the value is truthy. Built on `wa... |

### Primitives (2 hooks)

| Hook | Description |
|------|-------------|
| [`createStore`](references/createStore.md) | Lazily-initialized store with `StoreProvider`, effectScope lifecycle, inter-store dependencies, a... |
| [`useScope`](references/useScope.md) |  |

### Reactivity (11 hooks)

| Hook | Description |
|------|-------------|
| [`useAutoReset`](references/useAutoReset.md) | Observable that automatically resets to a default value after a specified delay. Useful for tempo... |
| [`useComputedWithControl`](references/useComputedWithControl.md) | Computed Observable with explicit source control and manual trigger. Only recomputes when the dec... |
| [`useDataHistory`](references/useDataHistory.md) | A hook that automatically tracks changes to an Observable and manages undo/redo history. Records ... |
| [`useDebounced`](references/useDebounced.md) | Debounce an Observable value. Creates a read-only Observable that updates only after the source v... |
| [`useDebouncedHistory`](references/useDebouncedHistory.md) | A hook that tracks Observable change history with debounce. A thin wrapper around `useDataHistory... |
| [`useLastChanged`](references/useLastChanged.md) | A hook that tracks when a source Observable last changed. Returns a read-only Observable containi... |
| [`useManualHistory`](references/useManualHistory.md) | A hook for manually managing Observable change history. It only records a snapshot when `commit()... |
| [`useManualReset`](references/useManualReset.md) | Observable with a manual `reset()` function that restores the value to its default. Unlike `useAu... |
| [`useRef$`](references/useRef$.md) | An observable element ref hook that serves as a drop-in replacement for `useRef`. Works with call... |
| [`useThrottled`](references/useThrottled.md) | Throttle an Observable value. Creates a read-only Observable that updates at most once per interv... |
| [`useThrottledHistory`](references/useThrottledHistory.md) | A hook that tracks Observable change history with throttle. A thin wrapper around `useHistory` wi... |

### Sync (3 hooks)

| Hook | Description |
|------|-------------|
| [`useOfflineFirst`](references/useOfflineFirst.md) | Reactive offline-first data binding powered by Legend-State's [sync engine](https://legendapp.com... |
| [`useRemote`](references/useRemote.md) | Reactive remote data binding powered by Legend-State's [sync engine](https://legendapp.com/open-s... |
| [`useStorage`](references/useStorage.md) | Reactive storage binding powered by Legend-State's [persist & sync](https://legendapp.com/open-so... |

### Timer (10 hooks)

| Hook | Description |
|------|-------------|
| [`useCountdown`](references/useCountdown.md) | Reactive countdown timer with pause/resume/reset controls |
| [`useFps`](references/useFps.md) | Reactive frames-per-second counter using requestAnimationFrame |
| [`useInterval`](references/useInterval.md) | Reactive counter that increments on every interval tick |
| [`useIntervalFn`](references/useIntervalFn.md) | Reactive setInterval wrapper with pause/resume control |
| [`useNow`](references/useNow.md) | Reactive current Date that auto-updates on every animation frame or interval |
| [`useRafFn`](references/useRafFn.md) | Call a function on every requestAnimationFrame with pause/resume control |
| [`useTimeAgo`](references/useTimeAgo.md) | Reactive human-readable time-ago string that auto-updates (powered by date-fns) |
| [`useTimeout`](references/useTimeout.md) | Reactive boolean that becomes true after a given delay |
| [`useTimeoutFn`](references/useTimeoutFn.md) | Reactive wrapper for setTimeout with start/stop control |
| [`useTimestamp`](references/useTimestamp.md) | Reactive Unix timestamp (ms) that auto-updates on every animation frame or interval |

### Utilities (8 hooks)

| Hook | Description |
|------|-------------|
| [`createProvider`](references/createProvider.md) | Collapses React Context + Provider component + useContext hook into a single call. Eliminates boi... |
| [`get`](references/get.md) | Extract values from MaybeObservable types |
| [`peek`](references/peek.md) | Extract values from MaybeObservable types without registering a tracking dependency |
| [`useDebounceFn`](references/useDebounceFn.md) | Debounce execution of a function. |
| [`useIsMounted`](references/useIsMounted.md) |  |
| [`useSupported`](references/useSupported.md) | SSR-safe browser feature detection as a reactive Observable |
| [`useThrottleFn`](references/useThrottleFn.md) | Throttle execution of a function. Especially useful for rate limiting execution of handlers on ev... |
| [`useWhenMounted`](references/useWhenMounted.md) | Execute a callback and expose its return value as a reactive Observable<T | undefined> — only aft... |

## @usels/web

### Browser (15 hooks)

| Hook | Description |
|------|-------------|
| [`useAnimate`](references/useAnimate.md) | Reactive [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API... |
| [`useCssVar`](references/useCssVar.md) | Reactively read and write CSS custom properties (CSS variables) on DOM elements. |
| [`useEventListener`](references/useEventListener.md) | Registers an event listener with `addEventListener` on mount and automatically removes it with `r... |
| [`useLocalStorage`](references/useLocalStorage.md) | Reactive `localStorage` binding. Thin wrapper around `createStorage` with `ObservablePersistLocal... |
| [`useMediaQuery`](references/useMediaQuery.md) | Tracks a CSS media query string as a reactive `Observable<boolean>`. Subscribes to `MediaQueryLis... |
| [`usePreferredColorScheme`](references/usePreferredColorScheme.md) | Reactive color scheme preference. Returns a `ReadonlyObservable` tracking the user's preferred co... |
| [`usePreferredContrast`](references/usePreferredContrast.md) | Reactive contrast preference. Returns a `ReadonlyObservable` tracking the user's preferred contra... |
| [`usePreferredDark`](references/usePreferredDark.md) | Reactive dark theme preference. Returns `Observable<boolean>` that tracks whether the user prefer... |
| [`usePreferredLanguages`](references/usePreferredLanguages.md) | Reactive browser languages. Returns a `ReadonlyObservable<readonly string[]>` tracking the user's... |
| [`usePreferredReducedMotion`](references/usePreferredReducedMotion.md) | Reactive reduced motion preference. Returns a `ReadonlyObservable` tracking the user's motion pre... |
| [`usePreferredReducedTransparency`](references/usePreferredReducedTransparency.md) | Reactive reduced transparency preference. Returns a `ReadonlyObservable` tracking the user's tran... |
| [`useScreenOrientation`](references/useScreenOrientation.md) | Reactive wrapper for the [Screen Orientation API](https://developer.mozilla.org/en-US/docs/Web/AP... |
| [`useScriptTag`](references/useScriptTag.md) | Dynamically load and unload an external script tag. The script is appended to `document.head` on ... |
| [`useSessionStorage`](references/useSessionStorage.md) | Reactive `sessionStorage` binding. Thin wrapper around `createStorage` with `ObservablePersistSes... |
| [`useStyleTag`](references/useStyleTag.md) | Dynamically inject and remove a `<style>` tag in `document.head`. The tag is appended on mount an... |

### Elements (13 hooks)

| Hook | Description |
|------|-------------|
| [`useDocumentVisibility`](references/useDocumentVisibility.md) | Tracks the browser tab's visibility state (`'visible'` or `'hidden'`) as a reactive `Observable<D... |
| [`useDraggable`](references/useDraggable.md) | Makes any element draggable using Pointer Events. Returns Observable values for position (`x$`, `... |
| [`useDropZone`](references/useDropZone.md) | Turns any element into a file drop zone. Tracks drag-over state and validates file types before a... |
| [`useElementBounding`](references/useElementBounding.md) | Tracks the bounding rect of a DOM element — `x`, `y`, `top`, `right`, `bottom`, `left`, `width`, ... |
| [`useElementSize`](references/useElementSize.md) | Tracks the width and height of a DOM element using the [ResizeObserver API](https://developer.moz... |
| [`useElementVisibility`](references/useElementVisibility.md) | Tracks whether a DOM element is visible within the viewport (or a specified scroll container). Re... |
| [`useIntersectionObserver`](references/useIntersectionObserver.md) | Reactive wrapper around the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/W... |
| [`useMouseInElement`](references/useMouseInElement.md) | Tracks the mouse cursor position relative to a DOM element and reports whether the cursor is insi... |
| [`useMutationObserver`](references/useMutationObserver.md) | Reactive wrapper around the [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/A... |
| [`useParentElement`](references/useParentElement.md) | Returns the `parentElement` of a target DOM node as a reactive `Observable`. Re-evaluates wheneve... |
| [`useResizeObserver`](references/useResizeObserver.md) | Observes one or more elements for size changes using the [ResizeObserver API](https://developer.m... |
| [`useWindowFocus`](references/useWindowFocus.md) | Tracks whether the browser window currently has focus as a reactive `Observable<boolean>`. Update... |
| [`useWindowSize`](references/useWindowSize.md) | Tracks the browser window dimensions as reactive `Observable<number>` values for width and height... |

### Sensors (38 hooks)

| Hook | Description |
|------|-------------|
| [`useBattery`](references/useBattery.md) | Reactive wrapper around the [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API... |
| [`useDeviceMotion`](references/useDeviceMotion.md) | Reactive [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent).... |
| [`useDeviceOrientation`](references/useDeviceOrientation.md) | Tracks the physical orientation of the device using the `deviceorientation` window event, exposin... |
| [`useDevicePixelRatio`](references/useDevicePixelRatio.md) | Reactively tracks `window.devicePixelRatio` using a `matchMedia` listener. Automatically updates ... |
| [`useDevicesList`](references/useDevicesList.md) | Reactively enumerates media input/output devices via the `MediaDevices` API. Provides filtered li... |
| [`useDisplayMedia`](references/useDisplayMedia.md) | Reactive wrapper around the [MediaDevices.getDisplayMedia()](https://developer.mozilla.org/en-US/... |
| [`useElementByPoint`](references/useElementByPoint.md) | Reactively tracks the DOM element at specified x/y coordinates using `document.elementFromPoint()... |
| [`useElementHover`](references/useElementHover.md) | Reactively tracks whether a DOM element is being hovered. Supports optional enter/leave delays fo... |
| [`useFocus`](references/useFocus.md) | Reactive utility that tracks whether a DOM element has focus, with two-way binding — read the cur... |
| [`useFocusWithin`](references/useFocusWithin.md) | Reactive utility that tracks whether focus is within a container element or any of its descendant... |
| [`useGeolocation`](references/useGeolocation.md) | Reactively tracks the user's geographic position using the Geolocation API. Wraps `navigator.geol... |
| [`useIdle`](references/useIdle.md) | Tracks whether the user is inactive (idle). Monitors user interaction events like mouse movement,... |
| [`useInfiniteScroll`](references/useInfiniteScroll.md) | Triggers a load callback whenever the scroll position reaches a boundary of a scrollable element,... |
| [`useKeyModifier`](references/useKeyModifier.md) | Reactively tracks the state of a keyboard modifier key (Shift, Control, Alt, CapsLock, etc.) usin... |
| [`useMagicKeys`](references/useMagicKeys.md) | Reactive key-press state — access any key as a `ReadonlyObservable<boolean>` that is `true` while... |
| [`useMouse`](references/useMouse.md) | Tracks the mouse/pointer cursor position reactively. Supports multiple coordinate systems (`page`... |
| [`useMousePressed`](references/useMousePressed.md) | Tracks mouse/touch press state reactively. Returns an observable boolean for the pressed state an... |
| [`useNavigatorLanguage`](references/useNavigatorLanguage.md) | Reactively tracks the browser's preferred language via `navigator.language`. Automatically update... |
| [`useNetwork`](references/useNetwork.md) | Reactive network status tracking. Provides online/offline state via `navigator.onLine` and detail... |
| [`useOnClickOutside`](references/useOnClickOutside.md) | Listen for clicks outside of a target element. Useful for closing modals, dropdowns, and popovers... |
| [`useOnElementRemoval`](references/useOnElementRemoval.md) | Fires a callback when the target element or any ancestor containing it is removed from the DOM. U... |
| [`useOnKeyStroke`](references/useOnKeyStroke.md) |  |
| [`useOnline`](references/useOnline.md) | Reactive online state. A thin wrapper around [`useNetwork`](/web/sensors/useNetwork) that returns... |
| [`useOnLongPress`](references/useOnLongPress.md) | Detect long press gestures on an element. Fires a handler after a configurable delay, with suppor... |
| [`useOnStartTyping`](references/useOnStartTyping.md) | Fires a callback when the user starts typing on non-editable elements. Useful for implementing se... |
| [`usePageLeave`](references/usePageLeave.md) | Reactively detects when the mouse cursor leaves the page. Useful for showing exit-intent popups, ... |
| [`useParallax`](references/useParallax.md) | Creates parallax effects easily. Uses `useDeviceOrientation` on mobile devices and falls back to ... |
| [`usePointer`](references/usePointer.md) | Reactive pointer state tracking. Monitors `pointerdown`, `pointermove`, `pointerup`, and `pointer... |
| [`usePointerLock`](references/usePointerLock.md) | Reactive wrapper around the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/P... |
| [`usePointerSwipe`](references/usePointerSwipe.md) | Reactive swipe detection based on PointerEvents. Detects swipe direction and distance. |
| [`useScroll`](references/useScroll.md) | Tracks the scroll position, scroll direction, arrived state (top/bottom/left/right), and scrollin... |
| [`useScrollLock`](references/useScrollLock.md) | Lock and unlock scrolling on a target element or `document.body`. Useful for modals, drawers, and... |
| [`useSpeechRecognition`](references/useSpeechRecognition.md) | Reactive wrapper around the [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs... |
| [`useSpeechSynthesis`](references/useSpeechSynthesis.md) | Reactive wrapper around the [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/Sp... |
| [`useSwipe`](references/useSwipe.md) | Reactive swipe detection based on TouchEvents. Detects swipe direction and length. |
| [`useTextSelection`](references/useTextSelection.md) | Reactively tracks the current text selection on the page. Listens to the `selectionchange` event ... |
| [`useUserMedia`](references/useUserMedia.md) | Reactive wrapper around the [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/doc... |
| [`useWindowScroll`](references/useWindowScroll.md) | Tracks the window scroll position, direction, arrived state, and scrolling status as reactive `Ob... |

---
Total: 108 hooks