---
title: get
description: Extract values from MaybeObservable types
category: Observable Utilities
---

Extract raw values from `MaybeObservable` types (works with both raw values and Legend-State observables).

## Usage

```typescript
import { get } from "@usels/core";
import { observable } from "@legendapp/state";

// With raw values
const rawValue = { name: "John", age: 30 };
console.log(get(rawValue)); // { name: 'John', age: 30 }
console.log(get(rawValue, "name")); // 'John'

// With observables
const obs$ = observable({ name: "John", age: 30 });
console.log(get(obs$)); // { name: 'John', age: 30 }
console.log(get(obs$, "name")); // 'John'
```
