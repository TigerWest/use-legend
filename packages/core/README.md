# @usels/core

Observable-native React utility hooks for [Legend-State](https://legendapp.com/open-source/state/).

Inspired by [VueUse](https://vueuse.org/) and [react-use](https://github.com/streamich/react-use), `@usels/core` brings the same composable utility philosophy — but built from the ground up for **observable-first reactivity**. Every hook returns Legend-State observables instead of using `useState`, enabling fine-grained updates without re-rendering the entire component tree.

## Installation

```bash
npm install @usels/core@beta @legendapp/state react
# or
pnpm add @usels/core@beta @legendapp/state react
```

## Quick Example

```tsx
import { useRef$, useElementSize } from '@usels/core';

function SizeDisplay() {
  const el$ = useRef$<HTMLDivElement>();
  const size$ = useElementSize(el$);

  return (
    <div ref={el$} style={{ resize: 'both', overflow: 'auto', padding: 16 }}>
      {size$.width.get().toFixed(0)} × {size$.height.get().toFixed(0)}
    </div>
  );
}
```

`size$.width` and `size$.height` are observables — only the expressions that read them re-render, not the component.

## Hooks

### Elements

| Hook | Description |
|------|-------------|
| `useRef$` | Observable element ref — the foundation of `@usels/core` |
| `useElementSize` | Track element dimensions reactively |
| `useElementBounding` | Track element bounding rect |
| `useElementVisibility` | Observe whether an element is visible in the viewport |
| `useIntersectionObserver` | Reactive `IntersectionObserver` wrapper |
| `useResizeObserver` | Reactive `ResizeObserver` wrapper |
| `useMutationObserver` | Reactive `MutationObserver` wrapper |
| `useMouseInElement` | Track mouse position relative to an element |
| `useDraggable` | Make an element draggable |
| `useDropZone` | Create a drop zone for drag-and-drop |
| `useDocumentVisibility` | Track `document.visibilityState` |
| `useParentElement` | Get the parent element as an observable |
| `useWindowFocus` | Track window focus state |
| `useWindowSize` | Track window dimensions |

### Timer

| Hook | Description |
|------|-------------|
| `useFps` | Track frames per second |
| `useInterval` | Reactive counter on interval |
| `useIntervalFn` | Run a function on interval with pause/resume |
| `useNow` | Reactive `Date.now()` |
| `useRafFn` | Run a function on every `requestAnimationFrame` |
| `useTimeAgo` | Reactive relative time string (e.g. "3 minutes ago") |
| `useTimeout` | Reactive timeout state |
| `useTimeoutFn` | Run a function after timeout with controls |
| `useTimestamp` | Reactive timestamp with configurable interval |

### Browser

| Hook | Description |
|------|-------------|
| `useEventListener` | Auto-cleaning event listener that reacts to observable element refs |
| `useMediaQuery` | Reactive CSS media query matching |

### Sensors

| Hook | Description |
|------|-------------|
| `useScroll` | Track element scroll position |
| `useWindowScroll` | Track window scroll position |

### Utilities

| Hook | Description |
|------|-------------|
| `get` | Unwrap a value that may or may not be an observable |
| `peek` | Peek at an observable value without tracking |
| `usePeekInitial` | Get the initial value of an observable without subscribing |
| `useSupported` | Check browser API support as an observable |
| `useWhenMounted` | Run logic only after component mount |

## Features

- **Observable-native** — every hook returns Legend-State observables, not `useState`
- **Fine-grained reactivity** — only the expression reading the observable re-renders
- **Reactive element refs** — `useRef$` provides observable refs that hooks react to automatically
- **Tree-shakeable** — import only what you need
- **TypeScript** — full type safety
- **ESM & CJS** — supports both module systems

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@legendapp/state` | `^3.0.0-beta.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |

## Links

- [Documentation](https://tigerwest.github.io/use-legend/)
- [GitHub](https://github.com/TigerWest/use-legend)

## License

MIT
