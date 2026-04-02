---
title: useDebounced
description: "Debounce an Observable value. Creates a read-only Observable that updates only after the source value stops changing for the specified delay."
category: Reactivity
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable("hello");
const debounced$ = useDebounced(source$, 300);
// debounced$.get() updates 300ms after source$ stops changing
```

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable(0);
const debounced$ = useDebounced(source$, 300, { maxWait: 1000 });
// Forces update every 1000ms even with continuous source changes
```

```tsx
// @noErrors
import { useObservable } from "@legendapp/state/react";
import { useDebounced } from "@usels/core";

const source$ = useObservable("hello");
const delay$ = useObservable(300);
const debounced$ = useDebounced(source$, delay$);
// Changing delay$ applies from the next debounce cycle
```
