---
title: useWhenMounted
category: Browser Utilities
---

Execute a callback and expose its return value as a reactive `Observable<T | undefined>` — only after the component has mounted. Returns `undefined` during SSR and before hydration, then re-evaluates with the actual callback value once mounted. Unlike `useSupported`, the return value is not coerced to boolean — the full type `T` is preserved.

## Usage

```typescript
import { useWhenMounted } from "@usels/core";

const windowWidth = useWhenMounted(() => window.innerWidth);

// undefined on the server, actual width after mount
console.log(windowWidth.get());
```

### Deferred browser API access

```typescript
import { useWhenMounted } from "@usels/core";

const scrollY = useWhenMounted(() => window.scrollY);
```
