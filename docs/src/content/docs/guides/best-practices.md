---
title: Best Practices
description: Patterns and conventions for writing performant, maintainable code with use-legend.
---

`use-legend` hooks return Legend-State observables instead of plain React state. Following these conventions ensures you get the full benefit of fine-grained reactivity.

---

## 1. Always use the `$` suffix

Variables holding observables should end with `$`. This makes it immediately clear which values are reactive and which are plain.

```tsx
// ✅ Good
const count$ = useObservable(0);
const el$ = useRef$<HTMLDivElement>();
const size$ = useElementSize(el$);

// ❌ Bad — can't tell at a glance what's observable
const count = useObservable(0);
const el = useRef$<HTMLDivElement>();
```

> Enforce this automatically with [`@usels/eslint-plugin`](/guides/eslint/).

---

## 2. Use `useRef$` — the foundation of element-based hooks

`useRef$` returns an observable ref (`Ref$`) that `use-legend` hooks can react to. Most element-related hooks — `useEventListener`, `useElementSize`, `useScroll`, `useDraggable`, `useIntersectionObserver` etc. — accept a `Ref$` as their target. One `useRef$` call connects an element to the entire hook ecosystem.

```tsx
const el$ = useRef$<HTMLDivElement>();

// All of these react to el$ — when the element mounts, unmounts,
// or is replaced, each hook re-registers automatically.
useEventListener(el$, 'click', handleClick);
useElementSize(el$);
useScroll(el$);
useIntersectionObserver(el$, callback);

return <div ref={el$}>...</div>;
```

A plain `useRef` won't work — hooks can't detect when the element mounts.

```tsx
// ❌ Bad — hooks won't detect mount
const el = useRef<HTMLDivElement>(null);
useElementSize(el); // won't work
```

---

## 3. Read observables at the leaf

Call `.get()` as deep as possible in the observable tree. This narrows the subscription scope and minimizes re-renders.

```tsx
<span>{size$.width.get()}</span>
```
---

## 4. Use Legend-State components for conditional & list rendering

`<Show>`, `<For>`, and `<Memo>` provide fine-grained reactivity boundaries. Vanilla JS operators (`&&`, `? :`, `.map()`) cause the parent component to re-render.

```tsx
// ✅ Good — only the Show boundary re-renders
<Show if={isLoading$}>
  <Spinner />
</Show>

// ✅ Good — only changed items re-render
<For each={items$}>
  {(item$) => <li>{item$.name.get()}</li>}
</For>

// ❌ Avoid — parent component re-renders on every change
{isLoading$.get() && <Spinner />}
{items$.get().map(item => <li>{item.name}</li>)}
```

---

## 5. Set up the Auto Memo plugin

The Vite/Babel plugin transforms `count$.get()` into `<Memo>{() => count$.get()}</Memo>` at build time. Without it, bare `.get()` calls in JSX cause whole-component re-renders.

```typescript
// vite.config.ts
import { autoWrap } from '@usels/vite-plugin-legend-memo';

export default defineConfig({
  plugins: [
    autoWrap(), // must come before react()
    react(),
  ],
});
```

> See [Getting Started](/use-legend/guides/getting-started/#auto-memo--vite--babel-plugin) for full setup instructions.

---